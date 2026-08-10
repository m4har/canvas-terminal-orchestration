import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SettingsStatusBanner } from "./SettingsStatusBanner";

describe("SettingsStatusBanner", () => {
  it("renders success message", () => {
    render(
      <SettingsStatusBanner status={{ tone: "success", message: "Saved." }} testId="status" />
    );
    expect(screen.getByTestId("status")).toHaveTextContent("Saved.");
  });

  it("renders nothing when status is null", () => {
    const { container } = render(<SettingsStatusBanner status={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
