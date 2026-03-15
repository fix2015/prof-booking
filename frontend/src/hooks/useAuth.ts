import { useMutation } from "@tanstack/react-query";
import {
  authApi,
  LoginPayload,
  OwnerRegisterPayload,
  ProfessionalRegisterPayload,
  MasterRegisterPayload,
} from "@/api/auth";
import { useAuthContext } from "@/context/AuthContext";

export function useLogin() {
  const { login } = useAuthContext();
  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (tokens) => login(tokens),
  });
}

export function useRegisterOwner() {
  const { login } = useAuthContext();
  return useMutation({
    mutationFn: (data: OwnerRegisterPayload) => authApi.registerOwner(data),
    onSuccess: (tokens) => login(tokens),
  });
}

export function useRegisterProfessional() {
  const { login } = useAuthContext();
  return useMutation({
    mutationFn: (data: ProfessionalRegisterPayload) => authApi.registerProfessional(data),
    onSuccess: (tokens) => login(tokens),
  });
}

// Backward-compat alias
export function useRegisterMaster() {
  const { login } = useAuthContext();
  return useMutation({
    mutationFn: (data: MasterRegisterPayload) => authApi.registerMaster(data),
    onSuccess: (tokens) => login(tokens),
  });
}

export function useLogout() {
  const { logout } = useAuthContext();
  return useMutation({ mutationFn: logout });
}

export { useAuthContext as useAuth };
