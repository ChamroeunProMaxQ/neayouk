import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type TelegramIntegrationDto } from "@repo/contracts";
import { TelegramIntegrationCard } from "./telegram-integration-card";
import { apiClient } from "@/shared/lib/api-client";

const mockIntegration: TelegramIntegrationDto = {
  branchId: 1,
  provider: "TELEGRAM",
  isEnabled: true,
  isConfigured: true,
  botUsername: "neayouk_test_bot",
  botTokenMasked: "123456789:••••••••••••••••••••••••••••••••••••",
  defaultChatId: "-100123456789",
  attendanceChatId: "-100987654321",
  paymentChatId: "",
  leaveChatId: "",
  announcementChatId: "",
  notificationEvents: {
    attendance: true,
    payment: true,
    leave: true,
    announcement: false,
  },
  lastTestedAt: "2026-09-07T00:00:00.000Z",
  lastTestStatus: "SUCCESS",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("TelegramIntegrationCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders integration details when configured and enabled", () => {
    render(<TelegramIntegrationCard integration={mockIntegration} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Connected \(neayouk_test_bot\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/master default chat id \/ channel/i)).toHaveValue(
      "-100123456789"
    );
  });

  it("toggles setup instructions accordion", async () => {
    const user = userEvent.setup();
    render(<TelegramIntegrationCard integration={mockIntegration} />, {
      wrapper: createWrapper(),
    });

    const guideToggle = screen.getByRole("button", {
      name: /how to set up your telegram school bot/i,
    });
    expect(guideToggle).toBeInTheDocument();

    // Click to expand
    await user.click(guideToggle);
    expect(
      screen.getByText(/@BotFather/i)
    ).toBeInTheDocument();
  });

  it("dispatches test connection message and displays test success alert", async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        status: 200,
        message: "Test message sent successfully",
        data: {
          success: true,
          message: "Test message delivered to Telegram Chat ID: -100123456789",
          botUsername: "neayouk_test_bot",
          chatId: "-100123456789",
          testedAt: new Date().toISOString(),
        },
      },
    });

    render(<TelegramIntegrationCard integration={mockIntegration} />, {
      wrapper: createWrapper(),
    });

    const testBtn = screen.getByRole("button", { name: /send test message/i });
    await user.click(testBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining("/settings/integrations/telegram/test"),
        expect.objectContaining({
          targetCategory: "default",
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/test message delivered to telegram chat id/i)
      ).toBeInTheDocument();
    });
  });

  it("updates telegram settings successfully", async () => {
    const user = userEvent.setup();
    const putSpy = vi.spyOn(apiClient, "put").mockResolvedValue({
      data: {
        status: 200,
        message: "Telegram integration updated successfully",
        data: {
          ...mockIntegration,
          defaultChatId: "-100999999999",
        },
      },
    });

    render(<TelegramIntegrationCard integration={mockIntegration} />, {
      wrapper: createWrapper(),
    });

    const defaultChatInput = screen.getByLabelText(
      /master default chat id \/ channel/i
    );
    await user.clear(defaultChatInput);
    await user.type(defaultChatInput, "-100999999999");

    const saveBtn = screen.getByRole("button", {
      name: /save telegram settings/i,
    });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith(
        expect.stringContaining("/settings/integrations/telegram"),
        expect.objectContaining({
          defaultChatId: "-100999999999",
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/telegram configuration saved successfully/i)
      ).toBeInTheDocument();
    });
  });
});
