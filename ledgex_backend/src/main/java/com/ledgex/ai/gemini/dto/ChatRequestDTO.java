package com.ledgex.ai.gemini.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequestDTO {
    private String prompt;
    private Integer month;
    private Integer year;
}
