package com.app.silhouette.post;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qnas")
public class QnaController {

    @Autowired
    private QnaService qnaService;

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean mine,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return qnaService.selectQnaPage(page, size, mine, authorization);
    }

    @GetMapping("/{qnaSeq}")
    public QnaDTO detail(
            @PathVariable long qnaSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return qnaService.selectQna(qnaSeq, authorization);
    }

    @PostMapping("/{qnaSeq}/verify")
    public QnaDTO verify(
            @PathVariable long qnaSeq,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return qnaService.verifyPassword(qnaSeq, body.get("password"), authorization);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @RequestBody QnaDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        long qnaSeq = qnaService.insertQna(dto, authorization);
        return ResponseEntity.ok(Map.of("qnaSeq", qnaSeq));
    }

    @GetMapping("/{qnaSeq}/edit")
    public QnaDTO edit(
            @PathVariable long qnaSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return qnaService.selectQnaForEdit(qnaSeq, authorization);
    }

    @PutMapping("/{qnaSeq}")
    public ResponseEntity<Void> update(
            @PathVariable long qnaSeq,
            @RequestBody QnaDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        qnaService.updateQna(qnaSeq, dto, authorization);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{qnaSeq}")
    public ResponseEntity<Void> delete(
            @PathVariable long qnaSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        qnaService.deleteQna(qnaSeq, authorization);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{qnaSeq}/answer")
    public ResponseEntity<Void> createAnswer(
            @PathVariable long qnaSeq,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        qnaService.insertAnswer(qnaSeq, body.get("content"), authorization);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{qnaSeq}/answer")
    public ResponseEntity<Void> updateAnswer(
            @PathVariable long qnaSeq,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        qnaService.updateAnswer(qnaSeq, body.get("content"), authorization);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{qnaSeq}/answer")
    public ResponseEntity<Void> deleteAnswer(
            @PathVariable long qnaSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        qnaService.deleteAnswer(qnaSeq, authorization);
        return ResponseEntity.ok().build();
    }
}