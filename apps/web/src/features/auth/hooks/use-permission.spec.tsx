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

  it("handles granular attendance permissions and umbrella hierarchy", () => {
    // Case 1: User only has student_attendance permission
    useAuthStore.setState({
      user: {
        id: 3,
        username: "teacher_jane",
        userType: UserTypeEnum.CMS,
        roles: ["teacher"],
        permissions: [
          { resource: "student_attendance", action: "read" },
          { resource: "student_attendance", action: "create" },
        ],
      },
      isAuthenticated: true,
    });

    const { result: r1, unmount: unmount1 } = renderHook(() => usePermission());
    expect(r1.current.can("read", "student_attendance")).toBe(true);
    expect(r1.current.can("create", "student_attendance")).toBe(true);
    expect(r1.current.can("read", "teacher_attendance")).toBe(false);
    expect(r1.current.can("read", "leave_request")).toBe(false);
    unmount1();

    // Case 2: User with umbrella attendance permission gets access to sub-resources
    useAuthStore.setState({
      user: {
        id: 4,
        username: "dean",
        userType: UserTypeEnum.CMS,
        roles: ["dean"],
        permissions: [
          { resource: "attendance", action: "manage" },
        ],
      },
      isAuthenticated: true,
    });

    const { result: r2, unmount: unmount2 } = renderHook(() => usePermission());
    expect(r2.current.can("read", "student_attendance")).toBe(true);
    expect(r2.current.can("read", "teacher_attendance")).toBe(true);
    expect(r2.current.can("read", "leave_request")).toBe(true);
    unmount2();

    // Case 3: User only has program permission (cannot access class)
    useAuthStore.setState({
      user: {
        id: 5,
        username: "curriculum_lead",
        userType: UserTypeEnum.CMS,
        roles: ["lead"],
        permissions: [
          { resource: "program", action: "read" },
        ],
      },
      isAuthenticated: true,
    });

    const { result: r3, unmount: unmount3 } = renderHook(() => usePermission());
    expect(r3.current.can("read", "program")).toBe(true);
    expect(r3.current.can("read", "class")).toBe(false);
    expect(r3.current.can("read", "academic_year")).toBe(false);
    unmount3();

    // Case 4: User with umbrella academic permission gets access to class & program
    useAuthStore.setState({
      user: {
        id: 6,
        username: "academic_director",
        userType: UserTypeEnum.CMS,
        roles: ["director"],
        permissions: [
          { resource: "academic", action: "manage" },
        ],
      },
      isAuthenticated: true,
    });

    const { result: r4, unmount: unmount4 } = renderHook(() => usePermission());
    expect(r4.current.can("read", "program")).toBe(true);
    expect(r4.current.can("read", "class")).toBe(true);
    expect(r4.current.can("read", "academic_year")).toBe(true);
    unmount4();
  });
});
