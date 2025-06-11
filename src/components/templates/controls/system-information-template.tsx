import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import React from "react";

import { Eyes, SystemInfo } from "@/models/sensors";

interface SystemInformationTemplateProps {
  systemInfo: SystemInfo;
  openEyes: boolean;
  setEyesStatus: (status: boolean) => void;
  selectedEyes: Eyes | null;
  setSelectedEyes: (eyes: Eyes | null) => void;
}

const SystemInformationTemplate = ({
  systemInfo,
  openEyes,
  setEyesStatus,
  selectedEyes,
  setSelectedEyes,
}: SystemInformationTemplateProps) => {
  const selectEyes = (selection: React.ChangeEvent<HTMLSelectElement>) => {
    const currEye = systemInfo?.eyes.find((_, i) => i === Number(selection.target.value));

    if (selectedEyes !== null && currEye?.index !== selectedEyes.index) {
      if (openEyes) {
        setEyesStatus(false);
      }
    } else {
      if (!openEyes) {
        setEyesStatus(true);
      }
    }
    setSelectedEyes(currEye ? currEye : null);
  };

  return (
    <>
      <div>
        <Chip className="max-w" color="warning" size="lg">
          System Information
        </Chip>
      </div>

      <div className="w-full flex flex-row flex-wrap gap-2">
        <div className="w-full flex flex-row flex-wrap gap-1">
          <Chip>OS Type</Chip>
          <p>{systemInfo.os_type}</p>
        </div>

        <div className="w-full flex flex-row flex-wrap gap-1">
          <Chip>OS Release</Chip>
          <p>{systemInfo.os_release}</p>
        </div>
      </div>

      <Chip className="max-w" color="success" size="md" variant="dot">
        Available Eyes
      </Chip>

      <Select className="max-w-xs" label="Select eyes" onChange={(k) => selectEyes(k)}>
        {systemInfo.eyes.map((eye, index) => (
          <SelectItem key={index}>{eye.name}</SelectItem>
        ))}
      </Select>
    </>
  );
};

export default SystemInformationTemplate;
