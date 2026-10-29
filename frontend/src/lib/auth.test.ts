import { apiPost } from "@/lib/apiClient";
import { logout } from "@/lib/auth";

jest.mock("./apiClient", function mockApiClient() {
  return {
    apiPost: jest.fn(),
  };
});

const mockedApiPost = jest.mocked(apiPost);
let consoleError: jest.SpyInstance;

beforeEach(function resetLogoutTest() {
  localStorage.clear();
  consoleError = jest.spyOn(console, "error").mockImplementation(function suppressExpectedLogoutError() {});
  jest.clearAllMocks();
});

afterEach(function restoreLogoutTest() {
  consoleError.mockRestore();
});

test("clears local auth and redirects when backend logout fails", async function logoutAfterNetworkFailure() {
  let destination = "";

  function recordRedirect(path: string): void {
    destination = path;
  }

  localStorage.setItem("aegis_token", "signed.jwt.token");
  localStorage.setItem("aegis_role", "CANDIDATE");
  mockedApiPost.mockRejectedValueOnce(new Error("network unavailable"));

  await logout(undefined, recordRedirect);

  expect(mockedApiPost).toHaveBeenCalledWith(
    "/api/v1/auth/logout",
    undefined,
    {
      authToken: "signed.jwt.token",
      suppressUnauthorizedHandling: true,
    }
  );
  expect(localStorage.getItem("aegis_token")).toBeNull();
  expect(localStorage.getItem("aegis_role")).toBeNull();
  expect(destination).toBe("/auth?mode=login");
});

test("clears local auth and redirects when backend rejects the token", async function logoutAfterUnauthorizedResponse() {
  let destination = "";

  function recordRedirect(path: string): void {
    destination = path;
  }

  localStorage.setItem("aegis_token", "revoked.jwt.token");
  localStorage.setItem("aegis_role", "RECRUITER");
  mockedApiPost.mockRejectedValueOnce(new Error("unauthorized"));

  await logout("/", recordRedirect);

  expect(localStorage.getItem("aegis_token")).toBeNull();
  expect(localStorage.getItem("aegis_role")).toBeNull();
  expect(destination).toBe("/");
});

test("redirects without a backend request when no token is stored", async function logoutWithoutStoredToken() {
  let destination = "";

  function recordRedirect(path: string): void {
    destination = path;
  }

  localStorage.setItem("aegis_role", "CANDIDATE");

  await logout("/", recordRedirect);

  expect(mockedApiPost).not.toHaveBeenCalled();
  expect(localStorage.getItem("aegis_token")).toBeNull();
  expect(localStorage.getItem("aegis_role")).toBeNull();
  expect(destination).toBe("/");
});
