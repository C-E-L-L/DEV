package com.cell.platform.service;

import com.cell.platform.dto.response.AiAnalysisResponse;
import com.cell.platform.exception.ErrorCode;
import com.cell.platform.exception.InfraStructureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;

@Slf4j
@Service
public class AiClientService {

    private final WebClient webClient;

    public AiClientService(@Value("${ai-server.base-url}") String baseUrl) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    public AiAnalysisResponse analyze(MultipartFile file) {
        MultipartBodyBuilder body = buildMultipartBody(file);
        return requestAnalysis(body);
    }

    private MultipartBodyBuilder buildMultipartBody(MultipartFile file) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(file.getBytes()))
                    .filename(file.getOriginalFilename())
                    .contentType(MediaType.IMAGE_JPEG);
            return builder;
        } catch (IOException e) {
            throw new InfraStructureException("파일 읽기에 실패했습니다.", ErrorCode.G001);
        }
    }

    private AiAnalysisResponse requestAnalysis(MultipartBodyBuilder body) {
        try {
            return webClient.post()
                    .uri("/api/analyze")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(body.build()))
                    .retrieve()
                    .bodyToMono(AiAnalysisResponse.class)
                    .block();
        } catch (Exception e) {
            throw new InfraStructureException("AI 서버 분석에 실패했습니다: " + e.getMessage(), ErrorCode.T002);
        }
    }
}
