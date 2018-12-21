import { Slot } from "ask-sdk-model";

export function getSlotId(slot: Slot): string {
  if (!slot || !slot.value) {
    return null;
  }
  try {
    if (slot.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_MATCH") {
      return null;
    }

    return slot.resolutions.resolutionsPerAuthority[0].values[0].value.id;
  } catch (e) {
    return null;
  }
}
