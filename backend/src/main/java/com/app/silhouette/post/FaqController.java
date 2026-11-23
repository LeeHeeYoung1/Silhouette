package com.app.silhouette.post;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faqs")
public class FaqController {

    @Autowired
    private FaqService faqService;

    // 카테고리 목록
    @GetMapping("/categories")
    public List<String> categories() {
        return faqService.getCategories();
    }

    // FAQ 목록 (?category=계정)
    @GetMapping
    public List<FaqDTO> list(
            @RequestParam(required = false) String category,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return faqService.selectFaqList(category, authorization);
    }

    // 수정 화면용 한 건 (관리자)
    @GetMapping("/{faqSeq}/edit")
    public FaqDTO edit(
            @PathVariable long faqSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return faqService.selectFaqForEdit(faqSeq, authorization);
    }

    // 등록 (관리자)
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @RequestBody FaqDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        long faqSeq = faqService.insertFaq(dto, authorization);
        return ResponseEntity.ok(Map.of("faqSeq", faqSeq));
    }

    // 수정 (관리자)
    @PutMapping("/{faqSeq}")
    public ResponseEntity<Void> update(
            @PathVariable long faqSeq,
            @RequestBody FaqDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        faqService.updateFaq(faqSeq, dto, authorization);
        return ResponseEntity.ok().build();
    }

    // 삭제 (관리자)
    @DeleteMapping("/{faqSeq}")
    public ResponseEntity<Void> delete(
            @PathVariable long faqSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        faqService.deleteFaq(faqSeq, authorization);
        return ResponseEntity.ok().build();
    }
}