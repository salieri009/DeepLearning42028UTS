import { useCallback, useState } from "react";
import styled from "styled-components";
import { useSessionArchive } from "@/features/session-archive";
import {
  buildSessionExportBundle,
  downloadSessionJson,
} from "@/features/session-archive/lib/exportSessionJson";
import { useSessionPreview } from "@/features/session-archive/model/useSessionPreview";
import { buildHtmlReport, printHtmlReport } from "@/features/report-generation";
import { ArchiveFilters } from "@/widgets/archive-filters";
import { AppShell } from "@/widgets/app-shell";
import { BottomNav } from "@/widgets/bottom-nav";
import { SessionHistoryTable } from "@/widgets/session-history-table";
import { SessionPreviewPanel } from "@/widgets/session-preview-panel";
import { SideNav } from "@/widgets/side-nav";
import { TopNav } from "@/widgets/top-nav";
import { listDetections, listSessionFrames } from "@/shared/api";
import { reportError } from "@/shared/lib/reportError";
import { AquaPillButton, ChromeText, Icon } from "@/shared/ui";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing[1]} 0 0;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[1]};
  color: ${({ theme }) => theme.color.info[60]};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const TableCol = styled.div`
  grid-column: 1;
`;

const PreviewCol = styled.div`
  grid-column: 1;

  @media (min-width: 1024px) {
    grid-column: 2;
    grid-row: 2;
  }
`;

const FiltersCol = styled.div`
  grid-column: 1 / -1;
`;

export function ArchivePage() {
  const archive = useSessionArchive();
  const preview = useSessionPreview(archive.selectedId);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    const session = archive.selectedDetail;
    if (!session || exporting) return;

    setExporting(true);
    try {
      const [detectionData, frameData] = await Promise.all([
        listDetections(session.id, { limit: 500 }),
        listSessionFrames(session.id, 100),
      ]);
      downloadSessionJson(
        buildSessionExportBundle(session, frameData.items, detectionData.items),
      );
    } catch (err) {
      reportError("Export session error", err);
    } finally {
      setExporting(false);
    }
  }, [archive.selectedDetail, exporting]);

  const handleGenerateReport = useCallback(() => {
    const session = archive.selectedDetail;
    if (!session) return;
    const html = buildHtmlReport({
      kind: "archive",
      generatedAt: new Date().toISOString(),
      session,
      frames: preview.frames,
      stats: preview.stats ?? undefined,
    });
    printHtmlReport(html);
  }, [archive.selectedDetail, preview.frames, preview.stats]);

  return (
    <AppShell
      topNav={<TopNav />}
      sideNav={<SideNav activeItem="logs" />}
      bottomNav={<BottomNav />}
    >
      <Header>
        <div>
          <ChromeText as="h1" style={{ fontSize: "32px", textTransform: "uppercase" }}>
            Analysis Archive
          </ChromeText>
          <Subtitle>RETRIEVING HISTORICAL TELEMETRY DATA...</Subtitle>
        </div>
        <AquaPillButton
          type="button"
          disabled={archive.selectedDetail == null || exporting}
          title={archive.selectedDetail == null ? "Select a session first" : "Download JSON export"}
          onClick={() => void handleExport()}
        >
          <Icon name="download" size={18} />
          {exporting ? "EXPORTING..." : "EXPORT DATA"}
        </AquaPillButton>
      </Header>

      <Grid>
        <FiltersCol>
          <ArchiveFilters
            dateRange={archive.dateRange}
            riskFilter={archive.riskFilter}
            sourceFilter={archive.sourceFilter}
            onDateRangeChange={archive.setDateRange}
            onRiskFilterChange={archive.setRiskFilter}
            onSourceFilterChange={archive.setSourceFilter}
            onClear={archive.clearFilters}
          />
        </FiltersCol>

        <TableCol>
          <SessionHistoryTable
            sessions={archive.sessions}
            selectedId={archive.selectedId}
            loading={archive.loading}
            error={archive.error}
            currentPage={archive.currentPage}
            pageCount={archive.pageCount}
            emptyMessage={archive.emptyMessage}
            onSelect={archive.setSelectedId}
            onPrev={archive.goPrev}
            onNext={archive.goNext}
          />
        </TableCol>

        <PreviewCol>
          <SessionPreviewPanel
            session={archive.selectedDetail}
            loading={preview.loading}
            stats={archive.selectedDetail ? preview.stats : null}
            frames={archive.selectedDetail ? preview.frames : []}
            statsError={preview.error}
            onGenerateReport={handleGenerateReport}
            reportDisabled={archive.selectedDetail == null}
          />
        </PreviewCol>
      </Grid>
    </AppShell>
  );
}
