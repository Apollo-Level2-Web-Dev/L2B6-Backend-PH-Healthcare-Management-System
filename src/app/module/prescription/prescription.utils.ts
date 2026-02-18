import PDFDocument from 'pdfkit';
import { envVars } from '../../config/env';

interface PrescriptionData {
    doctorName: string;
    doctorEmail : string;
    patientName: string;
    patientEmail: string;
    followUpDate: Date;
    instructions: string;
    prescriptionId : string;
    appointmentDate: Date;
    createdAt: Date;
}

export const generatePrescriptionPDF = async (prescriptionData: PrescriptionData) : Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on('error', (error) => {
                reject(error);
            });

            // Title
            doc.fontSize(24).font('Helvetica-Bold').text('PRESCRIPTION', {
                align: 'center',
            });

            doc.moveDown(0.5);
            doc
                .fontSize(10)
                .font('Helvetica')
                .text('PH Healthcare Services', {
                    align: 'center',
                });
            doc.text('Your Health, Our Priority', { align: 'center' });

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Doctor Information
            doc.fontSize(11).font('Helvetica-Bold').text('Doctor Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${prescriptionData.doctorName}`)
                .text(`Email: ${prescriptionData.doctorEmail}`);

            doc.moveDown(0.8);

            // Patient Information
            doc.fontSize(11).font('Helvetica-Bold').text('Patient Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${prescriptionData.patientName}`)
                .text(`Email: ${prescriptionData.patientEmail}`);

            doc.moveDown(0.8);

            // Appointment & Prescription Details
            doc.fontSize(11).font('Helvetica-Bold').text('Prescription Details');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Prescription ID: ${prescriptionData.prescriptionId}`)
                .text(`Appointment Date: ${new Date(prescriptionData.appointmentDate).toLocaleDateString()}`)
                .text(`Issued Date: ${new Date(prescriptionData.createdAt).toLocaleDateString()}`);

            if (prescriptionData.followUpDate) {
                doc.text(
                    `Follow-up Date: ${new Date(prescriptionData.followUpDate).toLocaleDateString()}`
                );
            }

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Instructions/Medications
            doc.fontSize(11).font('Helvetica-Bold').text('Instructions');
            doc.fontSize(10).font('Helvetica');

            // Wrap text for long instructions
            doc.text(prescriptionData.instructions, {
                align: 'left',
                width: 445,
            });

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Footer
            doc.fontSize(9).font('Helvetica').text(
                'This is an electronically generated prescription. Please follow all instructions provided by your doctor.',
                {
                    align: 'center',
                }
            );

            doc.text(`For more information, visit: ${envVars.FRONTEND_URL}`, {
                align: 'center',
            });

            // End the document
            doc.end();
        } catch (error) {
            reject(error);
        }
    })
}