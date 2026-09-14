import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SchoolLogoUploader } from "./school-logo-uploader";
import { apiClient } from "@/shared/lib/api-client";

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

describe("SchoolLogoUploader", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-logo-url");
    global.URL.revokeObjectURL = vi.fn();
    window.confirm = vi.fn(() => true);
  });

  it("renders current logo image when currentLogoUrl is provided", () => {
    render(
      <SchoolLogoUploader
        currentLogoUrl="/uploads/logos/demo-logo.png"
        schoolName="Neayouk Academy"
        motto="Knowledge is Power"
      />,
      { wrapper: createWrapper() }
    );

    const headerImg = screen.getByAltText("Header Logo Preview");
    expect(headerImg).toHaveAttribute("src", "/uploads/logos/demo-logo.png");
    expect(
      screen.getByRole("button", { name: /remove custom logo/i })
    ).toBeInTheDocument();
  });

  it("renders default system logo fallback when no logo is set", () => {
    render(
      <SchoolLogoUploader
        currentLogoUrl={null}
        schoolName="Neayouk Academy"
        motto="Knowledge is Power"
      />,
      { wrapper: createWrapper() }
    );

    const headerImg = screen.getByAltText("Header Logo Preview");
    expect(headerImg).toHaveAttribute("src", "/neayouk_logo.svg");
    expect(
      screen.queryByRole("button", { name: /remove custom logo/i })
    ).not.toBeInTheDocument();
  });

  it("rejects invalid file types", async () => {
    render(
      <SchoolLogoUploader
        currentLogoUrl={null}
        schoolName="Neayouk Academy"
      />,
      { wrapper: createWrapper() }
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const invalidFile = new File(["dummy content"], "malicious.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(
      screen.getByText(/please select a valid image file/i)
    ).toBeInTheDocument();
  });

  it("rejects file exceeding 2MB size limit", async () => {
    render(
      <SchoolLogoUploader
        currentLogoUrl={null}
        schoolName="Neayouk Academy"
      />,
      { wrapper: createWrapper() }
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File([new ArrayBuffer(3 * 1024 * 1024)], "large.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(
      screen.getByText(/image file size must be 2mb or less/i)
    ).toBeInTheDocument();
  });

  it("allows selecting a valid image and uploading it successfully", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        status: 200,
        message: "Logo uploaded successfully",
        data: {
          id: 1,
          name: "Neayouk Academy",
          logoUrl: "/uploads/logos/new-logo.png",
        },
      },
    });

    render(
      <SchoolLogoUploader
        currentLogoUrl={null}
        schoolName="Neayouk Academy"
      />,
      { wrapper: createWrapper() }
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["valid-image"], "logo.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(screen.getByText(/logo\.png/i)).toBeInTheDocument();
    const uploadBtn = screen.getByRole("button", { name: /^upload logo$/i });
    expect(uploadBtn).toBeInTheDocument();

    await userEvent.click(uploadBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining("/settings/logo"),
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/official logo uploaded successfully/i)
      ).toBeInTheDocument();
    });
  });

  it("confirms and triggers logo deletion when requested", async () => {
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
      data: {
        status: 200,
        message: "School logo removed",
        data: null,
      },
    });

    render(
      <SchoolLogoUploader
        currentLogoUrl="/uploads/logos/existing.png"
        schoolName="Neayouk Academy"
      />,
      { wrapper: createWrapper() }
    );

    const removeBtn = screen.getByRole("button", { name: /remove custom logo/i });
    await userEvent.click(removeBtn);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(
        expect.stringContaining("/settings/logo")
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/custom logo removed\. default system logo restored\./i)
      ).toBeInTheDocument();
    });
  });
});
