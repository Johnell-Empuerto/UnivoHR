jest.mock("../models/profile.model", () => ({
  getProfileByEmployeeId: jest.fn(),
  updateProfile: jest.fn(),
}));

const profileModel = require("../models/profile.model");
const { getProfile, updateProfile, calculateAge } = require("../services/profile.service");

describe("profile.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateAge", () => {
    it("returns null for null birthday", () => {
      expect(calculateAge(null)).toBeNull();
    });

    it("calculates age correctly", () => {
      const birthday = new Date();
      birthday.setFullYear(birthday.getFullYear() - 25);
      expect(calculateAge(birthday.toISOString())).toBe(25);
    });
  });

  describe("getProfile", () => {
    it("returns profile with age and full name", async () => {
      const birthday = new Date();
      birthday.setFullYear(birthday.getFullYear() - 30);
      profileModel.getProfileByEmployeeId.mockResolvedValue({
        id: 1, first_name: "John", middle_name: "M", last_name: "Doe",
        birthday: birthday.toISOString(),
      });

      const result = await getProfile(1);
      expect(result.age).toBe(30);
      expect(result.full_name).toContain("John");
    });

    it("throws when profile not found", async () => {
      profileModel.getProfileByEmployeeId.mockResolvedValue(null);
      await expect(getProfile(999)).rejects.toThrow("Profile not found");
    });
  });

  describe("updateProfile", () => {
    it("updates and returns profile from model", async () => {
      profileModel.updateProfile.mockResolvedValue({ id: 1, first_name: "Jane" });
      const result = await updateProfile(1, { first_name: "Jane" });
      expect(result.first_name).toBe("Jane");
      expect(profileModel.updateProfile).toHaveBeenCalledWith(1, { first_name: "Jane" });
    });
  });
});
