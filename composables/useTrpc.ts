export function useTrpc() {
  const { $client } = useNuxtApp()

  return $client
}
