jest.mock("../services/setting.service", () => ({
  getSetting: jest.fn(),
  getBoolSetting: jest.fn(),
}));

jest.mock("../utils/emailDesign", () => ({
  buildBrandedEmailDocument: jest.fn().mockReturnValue("<html>branded</html>"),
}));

const settingService = require("../services/setting.service");
const { buildBrandedEmailDocument } = require("../utils/emailDesign");
const { wrapEmailWithDesign } = require("../services/emailWrapper.service");

describe("emailWrapper.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("wraps content with company branding settings", async () => {
    settingService.getSetting.mockImplementation(async (key) => {
      const map = {
        company_name: "Test Corp",
        company_logo: "https://logo.url",
        company_address: "123 Main St",
        primary_color: "#ff0000",
        secondary_color: "#00ff00",
      };
      return map[key] || null;
    });
    settingService.getBoolSetting.mockImplementation(async (key) => {
      return key === "show_powered_by";
    });

    const result = await wrapEmailWithDesign("<p>Content</p>", "Test Subject");

    expect(buildBrandedEmailDocument).toHaveBeenCalledWith({
      subject: "Test Subject",
      branding: {
        companyName: "Test Corp",
        companyLogo: "https://logo.url",
        companyAddress: "123 Main St",
        primaryColor: "#ff0000",
        secondaryColor: "#00ff00",
        showPoweredBy: true,
        showCompanyNameInEmail: false,
      },
      headerSubtitle: "HR Management System",
      bodyHtml: "<p>Content</p>",
      showAutomatedDisclaimer: true,
    });
    expect(result).toBe("<html>branded</html>");
  });

  it("uses fallback colors when settings not set", async () => {
    settingService.getSetting.mockResolvedValue(null);
    settingService.getBoolSetting.mockResolvedValue(false);

    await wrapEmailWithDesign("content");

    expect(buildBrandedEmailDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        branding: expect.objectContaining({
          primaryColor: "#18181b",
          secondaryColor: "#3f3f46",
        }),
      }),
    );
  });
});
