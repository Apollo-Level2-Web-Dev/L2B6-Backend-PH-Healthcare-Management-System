import { readdir, readFile } from "fs/promises";
import path from "path";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { EmbeddingService } from "./embedding.service";
import { RAG_DEFAULTS, RagSourceType } from "./rag.constant";
import { RagUtils } from "./rag.utils";

const toVectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

const ingestIndexedDocument = async (payload: {
    sourceType: RagSourceType;
    sourceId: string;
    sourceLabel?: string;
    content: string;
    metadata?: Record<string, unknown>;
}) => {
    const chunks = RagUtils.splitIntoChunks(payload.content, RAG_DEFAULTS.CHUNK_SIZE, RAG_DEFAULTS.CHUNK_OVERLAP);

    for (const chunk of chunks) {
        const embedding = await EmbeddingService.generateEmbedding(chunk.content);
        const vectorLiteral = toVectorLiteral(embedding);

        await prisma.$executeRaw(Prisma.sql`
            INSERT INTO "document_embeddings"
            (
                "id",
                "chunkKey",
                "sourceType",
                "sourceId",
                "sourceLabel",
                "content",
                "metadata",
                "embedding",
                "updatedAt"
            )
            VALUES
            (
                ${RagUtils.createRowId()},
                ${`${payload.sourceType}:${payload.sourceId}:${chunk.chunkKey}`},
                ${payload.sourceType},
                ${payload.sourceId},
                ${payload.sourceLabel || null},
                ${chunk.content},
                ${JSON.stringify(payload.metadata || {})}::jsonb,
                CAST(${vectorLiteral} AS vector),
                NOW()
            )
            ON CONFLICT ("chunkKey")
            DO UPDATE SET
                "sourceType" = EXCLUDED."sourceType",
                "sourceId" = EXCLUDED."sourceId",
                "sourceLabel" = EXCLUDED."sourceLabel",
                "content" = EXCLUDED."content",
                "metadata" = EXCLUDED."metadata",
                "embedding" = EXCLUDED."embedding",
                "isDeleted" = false,
                "deletedAt" = null,
                "updatedAt" = NOW()
        `);
    }
};

const getMarkdownFiles = async (baseDir: string): Promise<string[]> => {
    const result: string[] = [];
    const entries = await readdir(baseDir, { withFileTypes: true });

    for (const entry of entries) {
        const absolutePath = path.join(baseDir, entry.name);

        if (entry.isDirectory()) {
            const nested = await getMarkdownFiles(absolutePath);
            result.push(...nested);
            continue;
        }

        if (entry.isFile() && /\.md$/i.test(entry.name)) {
            result.push(absolutePath);
        }
    }

    return result;
};

const indexMarkdownDirectories = async (directories: string[]) => {
    let indexed = 0;

    for (const directory of directories) {
        const absoluteDir = path.resolve(process.cwd(), directory);
        const files = await getMarkdownFiles(absoluteDir).catch(() => []);

        for (const file of files) {
            const content = await readFile(file, "utf8");
            await ingestIndexedDocument({
                sourceType: "DOC_MARKDOWN",
                sourceId: file,
                sourceLabel: path.basename(file),
                content,
                metadata: {
                    file,
                    directory,
                },
            });
            indexed += 1;
        }
    }

    return indexed;
};

const indexDoctors = async () => {
    const doctors = await prisma.doctor.findMany({
        where: {
            isDeleted: false,
        },
        include: {
            specialties: {
                include: {
                    specialty: true,
                },
            },
        },
    });

    for (const doctor of doctors) {
        const specialties = doctor.specialties.map((item) => item.specialty.title).join(", ");
        const content = [
            `Doctor Name: ${doctor.name}`,
            `Designation: ${doctor.designation}`,
            `Qualification: ${doctor.qualification}`,
            `Experience: ${doctor.experience} years`,
            `Current Working Place: ${doctor.currentWorkingPlace}`,
            `Appointment Fee: ${doctor.appointmentFee}`,
            `Specialties: ${specialties || "N/A"}`,
            `Address: ${doctor.address || "N/A"}`,
        ].join("\n");

        await ingestIndexedDocument({
            sourceType: "DOCTOR",
            sourceId: doctor.id,
            sourceLabel: doctor.name,
            content,
            metadata: {
                doctorId: doctor.id,
                specialties: doctor.specialties.map((item) => item.specialtyId),
                averageRating: doctor.averageRating,
            },
        });
    }

    return doctors.length;
};

const indexSpecialties = async () => {
    const specialties = await prisma.specialty.findMany({
        where: {
            isDeleted: false,
        },
    });

    for (const specialty of specialties) {
        const content = [
            `Specialty: ${specialty.title}`,
            `Description: ${specialty.description || "N/A"}`,
        ].join("\n");

        await ingestIndexedDocument({
            sourceType: "SPECIALTY",
            sourceId: specialty.id,
            sourceLabel: specialty.title,
            content,
            metadata: {
                specialtyId: specialty.id,
                title: specialty.title,
            },
        });
    }

    return specialties.length;
};

const reindex = async (params: { includeDocs?: boolean; includeDb?: boolean; docDirectories: string[]; sourceTypes?: RagSourceType[] }) => {
    const includeDocs = params.includeDocs ?? true;
    const includeDb = params.includeDb ?? true;

    const result = {
        docsIndexed: 0,
        doctorsIndexed: 0,
        specialtiesIndexed: 0,
    };

    if (includeDocs && (!params.sourceTypes || params.sourceTypes.includes("DOC_MARKDOWN"))) {
        result.docsIndexed = await indexMarkdownDirectories(params.docDirectories);
    }

    if (includeDb && (!params.sourceTypes || params.sourceTypes.includes("DOCTOR"))) {
        result.doctorsIndexed = await indexDoctors();
    }

    if (includeDb && (!params.sourceTypes || params.sourceTypes.includes("SPECIALTY"))) {
        result.specialtiesIndexed = await indexSpecialties();
    }

    return result;
};

export const IndexingService = {
    reindex,
};
