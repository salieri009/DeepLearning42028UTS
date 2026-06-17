package com.crowdnav.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * NFR-1 gate: mock-mode Spring → analyze-frame round-trip must stay under 500 ms
 * so the frontend 500 ms capture loop can keep up (NFR-2).
 */
@SpringBootTest
@AutoConfigureMockMvc
class NfrLatencyMockTest {

    private static final String VALID_B64 = Base64.getEncoder().encodeToString(new byte[] { 1, 2, 3 });
    private static final int WARMUP = 5;
    private static final int SAMPLES = 50;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void mockAnalyzeFrameAverageLatencyUnder500ms() throws Exception {
        var body = "{\"frame_base64\": \"" + VALID_B64 + "\"}";

        for (int i = 0; i < WARMUP; i++) {
            mockMvc.perform(post("/api/v1/analyze-frame")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
        }

        long startNs = System.nanoTime();
        for (int i = 0; i < SAMPLES; i++) {
            mockMvc.perform(post("/api/v1/analyze-frame")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
        }
        double avgMs = (System.nanoTime() - startNs) / (double) SAMPLES / 1_000_000.0;
        System.out.printf("NFR-1 mock analyze-frame avg latency: %.1f ms (n=%d)%n", avgMs, SAMPLES);

        assertThat(avgMs).isLessThan(500.0);
    }
}
