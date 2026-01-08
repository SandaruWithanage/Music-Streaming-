import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { StreamingService } from "./streaming.service";

@Controller("media")
export class MediaController {
  constructor(private readonly streaming: StreamingService) {}

  @Get(":trackId")
  async streamMedia(
    @Param("trackId") trackId: string,
    @Query("token") token: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (!token) throw new UnauthorizedException("Missing token");

    const validated = this.streaming.validateSignedToken(token);
    if (validated.trackId !== trackId) {
      throw new UnauthorizedException("Token does not match track");
    }

    const rangeHeader = req.headers.range;
    const { stream, headers, statusCode } =
      await this.streaming.getReadableStream(trackId, rangeHeader);

    // Write headers
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);

    res.status(statusCode);
    stream.pipe(res);
  }
}
