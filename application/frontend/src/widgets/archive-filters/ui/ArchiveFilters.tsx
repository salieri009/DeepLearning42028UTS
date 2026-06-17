import styled from "styled-components";
import { GlassPanel } from "@/shared/ui";
import type { DateRangeFilter, RiskFilter, SourceFilter } from "@/features/session-archive";

type ArchiveFiltersProps = {
  dateRange: DateRangeFilter;
  riskFilter: RiskFilter;
  sourceFilter: SourceFilter;
  onDateRangeChange: (v: DateRangeFilter) => void;
  onRiskFilterChange: (v: RiskFilter) => void;
  onSourceFilterChange: (v: SourceFilter) => void;
  onClear: () => void;
};

const Panel = styled(GlassPanel)`
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing[6]};
  position: relative;
  overflow: hidden;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Label = styled.label`
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Select = styled.select`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color.focus};
  }
`;

const RiskGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const RiskButton = styled.button<{ $active?: boolean; $variant: "safe" | "warning" | "danger" }>`
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radius.full};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  cursor: pointer;
  border: 1px solid
    ${({ theme, $variant }) => {
      if ($variant === "danger") return theme.color.danger;
      if ($variant === "warning") return theme.color.warning;
      return theme.color.success;
    }};
  background: ${({ theme, $active, $variant }) => {
    if ($active) {
      if ($variant === "danger") return theme.color.danger;
      if ($variant === "warning") return theme.color.warning;
      return theme.color.success;
    }
    return "transparent";
  }};
  color: ${({ theme, $active, $variant }) => {
    if ($active) return theme.color.textInverse;
    if ($variant === "danger") return theme.color.danger;
    if ($variant === "warning") return theme.color.warning;
    return theme.color.success;
  }};
`;

const ClearLink = styled.button`
  margin-left: auto;
  border: none;
  background: none;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.info[60]};
  text-decoration: underline;
  cursor: pointer;
`;

export function ArchiveFilters({
  dateRange,
  riskFilter,
  sourceFilter,
  onDateRangeChange,
  onRiskFilterChange,
  onSourceFilterChange,
  onClear,
}: ArchiveFiltersProps) {
  return (
    <Panel>
      <Field>
        <Label htmlFor="date-range">Date Range</Label>
        <Select
          id="date-range"
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as DateRangeFilter)}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </Select>
      </Field>

      <Field>
        <Label>Risk Level</Label>
        <RiskGroup>
          <RiskButton
            type="button"
            $variant="safe"
            $active={riskFilter === "SAFE"}
            onClick={() => onRiskFilterChange(riskFilter === "SAFE" ? "ALL" : "SAFE")}
          >
            SAFE
          </RiskButton>
          <RiskButton
            type="button"
            $variant="warning"
            $active={riskFilter === "WARNING"}
            onClick={() => onRiskFilterChange(riskFilter === "WARNING" ? "ALL" : "WARNING")}
          >
            WARNING
          </RiskButton>
          <RiskButton
            type="button"
            $variant="danger"
            $active={riskFilter === "DANGER"}
            onClick={() => onRiskFilterChange(riskFilter === "DANGER" ? "ALL" : "DANGER")}
          >
            DANGER
          </RiskButton>
        </RiskGroup>
      </Field>

      <Field>
        <Label htmlFor="source-type">Source Type</Label>
        <Select
          id="source-type"
          value={sourceFilter}
          onChange={(e) => onSourceFilterChange(e.target.value as SourceFilter)}
        >
          <option value="ALL">All Sources</option>
          <option value="WEBCAM">CCTV Feed</option>
          <option value="MOCK">Drone Mesh</option>
          <option value="UPLOAD">Mobile Unit</option>
        </Select>
      </Field>

      <ClearLink type="button" onClick={onClear}>
        Clear Filters
      </ClearLink>
    </Panel>
  );
}
