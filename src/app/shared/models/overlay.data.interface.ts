import { Observable } from "rxjs";
import { ChannelInterface } from "./channel.interface";

export interface OverlayData {
  channel?: Observable<ChannelInterface | undefined>;
}