import { EmbeddingService } from "./embedding.service";
import { IndexingService } from "./indexing.service";

export class RAGService {
  private embeddingService: EmbeddingService;
  // private llmService: LLMService;
  private indexingService: IndexingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.indexingService = new IndexingService();
  }

  async ingestDoctorsData() {
    return this.indexingService.indexDoctorsData();
  }
}
