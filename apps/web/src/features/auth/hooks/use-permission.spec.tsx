import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { usePermission } from "./use-permission";
import { useAuthStore } from "../stores/use-auth-store";
import { UserTypeEnum } from "@repo/contracts";

describe("usePermission", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it("grants all permissions to ADMIN user", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        username: "superadmin",
        userType: UserTypeEnum.ADMIN,
        roles: ["admin"],
        permissions: [],
      },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.can("delete", "user")).toBe(true);
    expect(result.current.can("manage", "academic")).toBe(true);
    expect(result.current.hasRole("teacher")).toBe(true); // Superuser has all roles
    expect(result.current.isUserType(UserTypeEnum.ADMIN)).toBe(true);
  });

  it("evaluates specific permissions for non-admin users", () => {
    useAuthStore.setState({
      user: {
        id: 2,
        username: "teacher1",
        userType: UserTypeEnum.CMS,
        roles: ["teacher"],
        permissions: [
          { resource: "academic", action: "read" },
          { resource: "attendance", action: "manage" },
        ],
      },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.can("read", "academic")).toBe(true);
    expect(result.current.can("create", "attendance")).toBe(true); // 'manage' covers 'create'
    expect(result.current.can("delete", "user")).toBe(false);
    expect(result.current.hasRole("teacher")).toBe(true);
    expect(result.current.hasRole("staff")).toBe(false);
    expect(result.current.isUserType(UserTypeEnum.CMS)).toBe(true);
    expect(result.current.isUserType(UserTypeEnum.CUSTOMER)).toBe(false);
  });
});
