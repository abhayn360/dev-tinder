import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, logout, signup } from '../api/auth';
import { getProfile } from '../api/profile';
import { queryKeys } from '../lib/queryKeys';

// The logged-in user, or null. The cookie is httpOnly, so JavaScript can't read it.
// We simply ask the server "who am I?".
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await getProfile();
      } catch (error) {
        if (error.response?.status === 401) return null; // not logged in: not an error
        throw error;
      }
    },
    staleTime: Infinity, // only changes when we log in, log out or edit the profile
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signup,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Forget everything cached for the previous user.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.me[0] });
      queryClient.setQueryData(queryKeys.me, null);
    },
  });
}
