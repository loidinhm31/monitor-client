import { Eyes, SystemInfo } from "@repo/ui/types/sensors";
import { Label } from "@repo/ui/components/atoms/label";
import { Badge } from "@repo/ui/components/atoms/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/atoms/select";

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
  const selectEyes = (value: string) => {
    const currEye = systemInfo?.eyes.find((_, i) => i === Number(value));

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
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-cyan-400/70 font-mono">OS Type</Label>
          <Badge className="mt-1 w-full justify-center bg-cyan-400/10 text-cyan-400 border-cyan-400/30" variant="glass">
            {systemInfo.os_type}
          </Badge>
        </div>
        <div>
          <Label className="text-cyan-400/70 font-mono">OS Release</Label>
          <Badge className="mt-1 w-full justify-center bg-cyan-400/10 text-cyan-400 border-cyan-400/30" variant="glass">
            {systemInfo.os_release}
          </Badge>
        </div>
      </div>

      <div>
        <Label className="text-cyan-400 font-mono mb-2 block">Available Eyes</Label>
        <Select onValueChange={selectEyes}>
          <SelectTrigger className="w-full bg-black/20 border-cyan-400/30 text-cyan-400">
            <SelectValue placeholder="Select eyes" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-cyan-400/30">
            {systemInfo.eyes.map((eye, index) => (
              <SelectItem key={index} value={index.toString()}>
                {eye.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default SystemInformationTemplate;
