import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRescoreJob } from "./useRescoreJob";
import * as api from "../api";
import { toast } from "sonner";

vi.mock("../api", () => ({
  rescoreJob: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useRescoreJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rescoring updates the job and shows a toast", async () => {
    const onJobUpdated = vi.fn().mockResolvedValue(undefined);
    vi.mocked(api.rescoreJob).mockResolvedValue({} as any);

    const { result } = renderHook(() => useRescoreJob(onJobUpdated));

    await act(async () => {
      await result.current.rescoreJob("job-1");
    });

    expect(api.rescoreJob).toHaveBeenCalledWith("job-1");
    expect(onJobUpdated).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Match recalculated");
  });
});
