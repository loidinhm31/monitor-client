export interface SystemInfo {
  os_type: string;
  os_release: string;
  eyes: Eye[];
}

export interface Eye {
  index: number | null;
  name: string;
}
