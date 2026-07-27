export type MeetingProviderState =
  | "online"
  | "setup_required"
  | "authorization_required"

export type MeetingProviderReadiness = {
  zoom: {
    configured: boolean
    state: MeetingProviderState
  }
  lark: {
    authorized: boolean
    configured: boolean
    state: MeetingProviderState
  }
  protectedLinksConfigured: boolean
}

export function classifyMeetingProviderReadiness(input: {
  zoomConfigured: boolean
  larkConfigured: boolean
  larkAuthorized: boolean
  protectedLinksConfigured: boolean
}): MeetingProviderReadiness {
  const zoomOnline = input.zoomConfigured && input.protectedLinksConfigured
  const larkOnline =
    input.larkConfigured &&
    input.larkAuthorized &&
    input.protectedLinksConfigured

  return {
    zoom: {
      configured: input.zoomConfigured,
      state: zoomOnline ? "online" : "setup_required",
    },
    lark: {
      authorized: input.larkAuthorized,
      configured: input.larkConfigured,
      state: larkOnline
        ? "online"
        : input.larkConfigured && input.protectedLinksConfigured
          ? "authorization_required"
          : "setup_required",
    },
    protectedLinksConfigured: input.protectedLinksConfigured,
  }
}

export const unavailableMeetingProviderReadiness =
  classifyMeetingProviderReadiness({
    zoomConfigured: false,
    larkConfigured: false,
    larkAuthorized: false,
    protectedLinksConfigured: false,
  })
