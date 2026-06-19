import { useCallback, useState } from "react";
import styled from "styled-components";
import { useSessionArchive } from "@/features/session-archive";
import {
  buildSessionExportBundle,
  downloadSessionJson,
} from "@/features/session-archive/lib/exportSessionJson";
import {
  confirmTruncatedExport,
  DETECTION_PREVIEW_LIMIT,
  FRAME_PREVIEW_LIMIT,
} from "@/features/session-archive/lib/sessionArchiveUtils";
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
import { AquaPillButton, Icon, PageChromeTitle } from "@/shared/ui";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
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

  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-template-columns: 2fr 1fr;
  }
`;

const TableCol = styled.div`
  grid-column: 1;

  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-row: 2;
    align-self: start;
  }
`;

const PreviewCol = styled.div`
  grid-column: 1;

  @media (min-width: ${({ theme }) => theme.layout.gridBreakpointLg}) {
    grid-column: 2;
    grid-row: 2;
    align-self: start;
    position: sticky;
    top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.spacing[5]});
  }
`;

const FiltersCol = styled.div`
  grid-column: 1 / -1;
`;

export function ArchivePage() {
  const archive = useSessionArchive();
  const preview = useSessionPreview(archive.selectedId, archive.selectedDetail);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    const session = archive.selectedDetail;
    if (!session || exporting) return;

    setExporting(true);
    try {
      const [detectionData, frameData] = await Promise.all([
        listDetections(session.id, { limit: DETECTION_PREVIEW_LIMIT }),
        listSessionFrames(session.id, FRAME_PREVIEW_LIMIT),
      ]);

      if (
        !confirmTruncatedExport(session, detectionData.items.length, frameData.items.length)
      ) {
        return;
      }

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
          <PageChromeTitle as="h1">Analysis Archive</PageChromeTitle>
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
            truncation={archive.selectedDetail ? preview.truncation : undefined}
            onGenerateReport={handleGenerateReport}
            reportDisabled={archive.selectedDetail == null}
          />
        </PreviewCol>
      </Grid>
    </AppShell>
  );
}
