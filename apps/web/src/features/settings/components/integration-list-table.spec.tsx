import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { type TelegramIntegrationDto } from "@repo/contracts";
import { IntegrationListTable } from "./integration-list-table";

const mockIntegration: TelegramIntegrationDto = {
  branchId: 1,
  provider: "TELEGRAM",
  isEnabled: true,
  isConfigured: true,
  botUsername: "neayouk_alerts_bot",
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

describe("IntegrationListTable", () => {
  it("renders registered integration channels in sub-table", () => {
    render(<IntegrationListTable integration={mockIntegration} />);

    expect(screen.getByText("Connected Channels & Integrations")).toBeInTheDocument();
    expect(screen.getByText("Telegram Bot Notifications")).toBeInTheDocument();
    expect(screen.getByText("Bakong KHQR Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("SMS Gateway (Cellcard / Smart)")).toBeInTheDocument();

    // Telegram details
    expect(screen.getByText("@neayouk_alerts_bot")).toBeInTheDocument();
    expect(screen.getByText("Connected & Active")).toBeInTheDocument();
    expect(screen.getByText("3 alert triggers active")).toBeInTheDocument();

    // Built-in Bakong details
    expect(screen.getByText("Built-in")).toBeInTheDocument();
    expect(screen.getByText("National Bank of Cambodia Open API")).toBeInTheDocument();

    // Coming soon SMS details
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("handles unconfigured telegram integration gracefully", () => {
    render(<IntegrationListTable integration={null} />);

    expect(screen.getByText("Telegram Bot Notifications")).toBeInTheDocument();
    expect(screen.getByText("Not configured")).toBeInTheDocument();
    expect(screen.getByText("Not Configured")).toBeInTheDocument();
  });

  it("triggers onConfigureTelegram callback when clicking Configure button", async () => {
    const onConfigureMock = vi.fn();
    render(
      <IntegrationListTable
        integration={mockIntegration}
        onConfigureTelegram={onConfigureMock}
      />
    );

    const configureBtn = screen.getByRole("button", { name: /configure/i });
    await userEvent.click(configureBtn);

    expect(onConfigureMock).toHaveBeenCalledTimes(1);
  });
});
