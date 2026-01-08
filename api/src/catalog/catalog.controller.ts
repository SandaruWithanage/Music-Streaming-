import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { PaginationQueryDto } from "../common/pagination/pagination.dto";

@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  // GET /tracks?skip=0&take=20
  @Get("tracks")
  listTracks(@Query() q: PaginationQueryDto) {
    return this.catalog.listTracks(q.skip ?? 0, q.take ?? 20);
  }

  // GET /tracks/:id
  @Get("tracks/:id")
  getTrack(@Param("id") id: string) {
    return this.catalog.getTrackById(id);
  }

  // GET /search?q=...&genre=...&artist=...&skip=...&take=...
  @Get("search")
  search(
    @Query("q") q?: string,
    @Query("genre") genre?: string,
    @Query("artist") artist?: string,
    @Query() pg?: PaginationQueryDto
  ) {
    return this.catalog.searchTracks({
      q,
      genre,
      artist,
      skip: pg?.skip ?? 0,
      take: pg?.take ?? 20,
    });
  }
}
