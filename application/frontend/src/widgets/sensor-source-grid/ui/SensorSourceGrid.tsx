import { useState } from "react";
import styled from "styled-components";
import type { SensorSource } from "@/entities/sensor";
import { SensorCard } from "@/entities/sensor";
import { Button, Modal } from "@/shared/ui";

type SensorSourceGridProps = {
  sources: SensorSource[];
  onAddSource?: (name: string, ip: string, feedLabel: string) => void;
  onUpdateSource?: (id: string, patch: Partial<SensorSource>) => void;
};

const Section = styled.section``;

const Header = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const AddLink = styled.button`
  border: none;
  background: none;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.info[60]};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
  }
`;

const EmptyHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textSecondary};
  font-size: ${({ theme }) => theme.typography.size[2]};
`;

const CheckboxRow = styled.label`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.layout.tabletBreakpoint}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.family.mono};
  font-size: ${({ theme }) => theme.typography.size[2]};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.textPrimary};
`;

export function SensorSourceGrid({ sources, onAddSource, onUpdateSource }: SensorSourceGridProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [settingsSource, setSettingsSource] = useState<SensorSource | null>(null);
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [feedLabel, setFeedLabel] = useState("CUSTOM // 1080p");

  const submitAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !onAddSource) return;
    onAddSource(name.trim(), ip.trim() || "0.0.0.0", feedLabel.trim() || "CUSTOM");
    setName("");
    setIp("");
    setFeedLabel("CUSTOM // 1080p");
    setAddOpen(false);
  };

  return (
    <Section>
      <Header>
        <AddLink type="button" onClick={() => setAddOpen(true)} aria-label="Add source">
          Add Source
        </AddLink>
      </Header>
      <Grid>
        {sources.length === 0 ? (
          <EmptyHint>
            No active webcam sessions yet. Start the dashboard camera to register a source.
          </EmptyHint>
        ) : null}
        {sources.map((source) => (
          <SensorCard
            key={source.id}
            source={source}
            onOpenSettings={
              source.id.startsWith("custom-")
                ? () => setSettingsSource(source)
                : undefined
            }
          />
        ))}
      </Grid>

      <Modal open={addOpen} title="Add Sensor Source" onClose={() => setAddOpen(false)}>
        <Form onSubmit={submitAdd}>
          <Field>
            Name
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            IP / Endpoint
            <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.100" />
          </Field>
          <Field>
            Feed label
            <Input value={feedLabel} onChange={(e) => setFeedLabel(e.target.value)} />
          </Field>
          <Button type="submit" $variant="primary">
            Add Source
          </Button>
        </Form>
      </Modal>

      <Modal
        open={settingsSource != null}
        title="Sensor Settings"
        onClose={() => setSettingsSource(null)}
      >
        {settingsSource ? (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              if (!onUpdateSource) return;
              onUpdateSource(settingsSource.id, {
                name: settingsSource.name,
                ip: settingsSource.ip,
                feedLabel: settingsSource.feedLabel,
                connected: settingsSource.connected,
              });
              setSettingsSource(null);
            }}
          >
            <Field>
              Display name
              <Input
                value={settingsSource.name}
                onChange={(e) =>
                  setSettingsSource({ ...settingsSource, name: e.target.value })
                }
              />
            </Field>
            <Field>
              IP / Endpoint
              <Input
                value={settingsSource.ip}
                onChange={(e) => setSettingsSource({ ...settingsSource, ip: e.target.value })}
              />
            </Field>
            <Field>
              Feed label
              <Input
                value={settingsSource.feedLabel}
                onChange={(e) =>
                  setSettingsSource({ ...settingsSource, feedLabel: e.target.value })
                }
              />
            </Field>
            <CheckboxRow>
              <input
                type="checkbox"
                checked={settingsSource.connected}
                onChange={(e) =>
                  setSettingsSource({ ...settingsSource, connected: e.target.checked })
                }
              />
              Connected
            </CheckboxRow>
            <Button type="submit" $variant="primary">
              Save
            </Button>
          </Form>
        ) : null}
      </Modal>
    </Section>
  );
}
