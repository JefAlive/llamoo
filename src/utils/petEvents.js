import EventEmitter from "events";
import { nanoid } from "../store/nanoid";

export const petEvents = new EventEmitter();

export function toast(message) {
  const messageId = nanoid();
  petEvents.emit("toast", message, messageId);
  return messageId;
}
