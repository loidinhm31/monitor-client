export interface SystemInfo {
  os_type: string;
  os_release: string;
  eyes: Eyes[];
}

export interface Eyes {
  index: number;
  name: string;
}
