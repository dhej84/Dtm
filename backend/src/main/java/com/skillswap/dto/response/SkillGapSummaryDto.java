package com.skillswap.dto.response;

import java.util.ArrayList;
import java.util.List;

public class SkillGapSummaryDto {

    private String studentId;
    private String studentName;
    private int totalGapsIdentified;
    private List<SkillGapDto> skillGaps = new ArrayList<>();
    private String informationalNotice = "Skill gap analysis is an informational recommendation to help prioritize peer learning goals, not an assessment of your academic capability.";

    public SkillGapSummaryDto() {}

    public SkillGapSummaryDto(String studentId, String studentName, int totalGapsIdentified,
                              List<SkillGapDto> skillGaps) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.totalGapsIdentified = totalGapsIdentified;
        this.skillGaps = skillGaps != null ? skillGaps : new ArrayList<>();
    }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public int getTotalGapsIdentified() { return totalGapsIdentified; }
    public void setTotalGapsIdentified(int totalGapsIdentified) { this.totalGapsIdentified = totalGapsIdentified; }

    public List<SkillGapDto> getSkillGaps() { return skillGaps; }
    public void setSkillGaps(List<SkillGapDto> skillGaps) { this.skillGaps = skillGaps; }

    public String getInformationalNotice() { return informationalNotice; }
    public void setInformationalNotice(String informationalNotice) { this.informationalNotice = informationalNotice; }
}
