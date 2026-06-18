import { useState } from "react";
import styled from "styled-components";
import type { SensorSource } from "@/entities/sensor";
import { SensorCard } from "@/entities/sensor";
import { Button, Icon, Modal } from "@/shared/ui";

type SensorSourceGridProps = {
  sources: SensorSource[];
  onAddSource?: (name: string, ip: string, feedLabel: string) => void;
  onUpdateSource?: (id: string, patch: Partial<SensorSource>) => void;
};

const Section = styled.section``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.size[4]};
  color: ${({ theme }) => theme.color.primary};
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
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: 768px) {
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
        <Title>
          <Icon name="videocam" size={22} />
          Sensor Sources
        </Title>
        <AddLink type="button" onClick={() => setAddOpen(true)} aria-label="Add source">
          Add Source
        </AddLink>
      </Header>
      <Grid>
        {sources.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>No active webcam sessions yet. Start the dashboard camera to register a source.</p>
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
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={settingsSource.connected}
                onChange={(e) =>
                  setSettingsSource({ ...settingsSource, connected: e.target.checked })
                }
              />
              Connected
            </label>
            <Button type="submit" $variant="primary">
              Save
            </Button>
          </Form>
        ) : null}
      </Modal>
    </Section>
  );
}
