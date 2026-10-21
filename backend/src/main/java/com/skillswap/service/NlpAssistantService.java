package com.skillswap.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Server-side NLP Assistant Service for SkillSwap.
 * Detects multilingual communication, Tanglish/code-mixing, and user educational intent.
 */
@Service
public class NlpAssistantService {

    public static class NlpAnalysisResult {
        private String detectedLanguage;
        private String intent;
        private String englishTranslation;
        private boolean isCodeMixed;

        public NlpAnalysisResult(String detectedLanguage, String intent, String englishTranslation, boolean isCodeMixed) {
            this.detectedLanguage = detectedLanguage;
            this.intent = intent;
            this.englishTranslation = englishTranslation;
            this.isCodeMixed = isCodeMixed;
        }

        public String getDetectedLanguage() { return detectedLanguage; }
        public String getIntent() { return intent; }
        public String getEnglishTranslation() { return englishTranslation; }
        public boolean isCodeMixed() { return isCodeMixed; }
    }

    private static final Map<String, String> KNOWN_PHRASES = new HashMap<>();

    static {
        KNOWN_PHRASES.put("indha lesson romba confusing ah iruku", "This lesson is very confusing.");
        KNOWN_PHRASES.put("arrays la indha part purila", "I don't understand this part in arrays.");
        KNOWN_PHRASES.put("mentor ku kekanum but epdi explain panradhu therila", "I want to ask the mentor, but I'm not sure how to explain it.");
        KNOWN_PHRASES.put("stack and queue difference sollunga", "Please explain the difference between stack and queue.");
        KNOWN_PHRASES.put("bro recursion epdi work aaguthu? indha part purila", "Bro, how does recursion work? I don't understand this part.");
        KNOWN_PHRASES.put("recursion ah konjam explain pannunga", "Could you please explain recursion a bit?");
        KNOWN_PHRASES.put("loops la break epdi use panradhu", "How do you use the break statement in loops?");
        KNOWN_PHRASES.put("ye topic thoda explain kar sakte ho?", "Could you please explain this topic a bit?");
        KNOWN_PHRASES.put("ee concept koncham explain cheyyagalara?", "Could you please explain this concept a bit?");
        KNOWN_PHRASES.put("ee concept swalpa explain maadi", "Please explain this concept a little bit.");
        KNOWN_PHRASES.put("ithu onnu explain cheyyamo?", "Could you please explain this to me?");
    }

    public NlpAnalysisResult analyze(String text) {
        if (text == null || text.isBlank()) {
            return new NlpAnalysisResult("English", "general", null, false);
        }

        String lower = text.trim().toLowerCase();

        // 1. Direct phrase matching
        if (KNOWN_PHRASES.containsKey(lower)) {
            boolean isTanglish = lower.contains("purila") || lower.contains("sollunga") || lower.contains("panradhu") || lower.contains("indha");
            String lang = isTanglish ? "Tanglish" : detectLanguageByKeywords(lower);
            return new NlpAnalysisResult(lang, inferIntent(lower), KNOWN_PHRASES.get(lower), true);
        }

        // 2. Tanglish keywords
        if (lower.contains("purila") || lower.contains("romba") || lower.contains("panradhu") ||
            lower.contains("sollunga") || lower.contains("indha") || lower.contains("konjam") ||
            lower.contains("epdi") || lower.contains("eppadi") || lower.contains("varudhu")) {
            return new NlpAnalysisResult("Tanglish", inferIntent(lower), generateTanglishTranslation(lower), true);
        }

        // 3. Script checks
        if (text.matches(".*[\\u0B80-\\u0BFF].*")) {
            return new NlpAnalysisResult("Tamil", inferIntent(lower), "Could you please explain this concept to me?", false);
        }
        if (text.matches(".*[\\u0900-\\u097F].*")) {
            String lang = text.contains("आहे") ? "Marathi" : "Hindi";
            return new NlpAnalysisResult(lang, inferIntent(lower), "Could you please clarify this topic?", false);
        }
        if (text.matches(".*[\\u0C00-\\u0C7F].*")) {
            return new NlpAnalysisResult("Telugu", inferIntent(lower), "Could you explain this concept a bit?", false);
        }
        if (text.matches(".*[\\u0C80-\\u0CFF].*")) {
            return new NlpAnalysisResult("Kannada", inferIntent(lower), "Please explain this topic to me.", false);
        }
        if (text.matches(".*[\\u0D00-\\u0D7F].*")) {
            return new NlpAnalysisResult("Malayalam", inferIntent(lower), "Could you please explain this?", false);
        }
        if (text.matches(".*[\\u0980-\\u09FF].*")) {
            return new NlpAnalysisResult("Bengali", inferIntent(lower), "Could you explain this topic a bit?", false);
        }

        // 4. Romanized Hindi
        if (lower.contains("thoda") || lower.contains("batao") || lower.contains("samajh") || lower.contains("kaise")) {
            return new NlpAnalysisResult("Hindi", inferIntent(lower), "Could you please explain this topic a bit?", true);
        }

        // 5. Romanized Telugu
        if (lower.contains("koncham") || lower.contains("cheppandi") || lower.contains("ardham") || lower.contains("ela")) {
            return new NlpAnalysisResult("Telugu", inferIntent(lower), "Could you explain this concept a bit?", true);
        }

        return new NlpAnalysisResult("English", inferIntent(lower), null, false);
    }

    private String detectLanguageByKeywords(String lower) {
        if (lower.contains("thoda") || lower.contains("sakte")) return "Hindi";
        if (lower.contains("koncham") || lower.contains("cheyyagalara")) return "Telugu";
        if (lower.contains("swalpa") || lower.contains("maadi")) return "Kannada";
        if (lower.contains("onnu") || lower.contains("cheyyamo")) return "Malayalam";
        return "English";
    }

    private String inferIntent(String lower) {
        if (lower.contains("error") || lower.contains("bug") || lower.contains("crash") || lower.contains("exception")) {
            return "debugging";
        }
        if (lower.contains("practice") || lower.contains("exercise") || lower.contains("problem")) {
            return "practice_request";
        }
        if (lower.contains("notes") || lower.contains("slides") || lower.contains("pdf")) {
            return "resource_request";
        }
        if (lower.contains("swap") || lower.contains("meet") || lower.contains("session")) {
            return "schedule_swap";
        }
        return "concept_clarification";
    }

    private String generateTanglishTranslation(String lower) {
        if (lower.contains("purila")) {
            return "I don't understand this section. Could you please explain it?";
        }
        if (lower.contains("difference")) {
            return "Could you please explain the difference in this topic?";
        }
        if (lower.contains("break") && lower.contains("use")) {
            return "How do you use the break statement in loops?";
        }
        return "Could you please clarify how this works?";
    }
}
