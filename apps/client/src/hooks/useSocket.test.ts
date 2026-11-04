import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import { socket, connectSocket } from '../api/socket';

vi.mock('../api/socket', () => ({
  socket: {
    connected: false,
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  },
  connectSocket: vi.fn(),
}));

vi.mock('../store/auth', () => ({
  useAuthStore: () => ({ accessToken: 'mock_token' }),
}));

describe('useSocket hook', () => {
  it('should initialize with socket connection status', () => {
    const { result } = renderHook(() => useSocket());
    expect(result.current.isConnected).toBe(false);
  });

  it('should call connectSocket if accessToken exists', () => {
    renderHook(() => useSocket());
    expect(connectSocket).toHaveBeenCalledWith('mock_token', undefined);
  });

  it('should handle connect_error event', () => {
    let connectErrorHandler: any;
    (socket.on as any).mockImplementation((event: string, handler: any) => {
      if (event === 'connect_error') connectErrorHandler = handler;
    });

    const { result } = renderHook(() => useSocket());
    
    act(() => {
      connectErrorHandler({ message: 'test error' });
    });
    
    expect(result.current.isConnected).toBe(false);
  });

  it('should update isConnected state on connect/disconnect events', () => {
    let connectHandler: any;
    let disconnectHandler: any;

    (socket.on as any).mockImplementation((event: string, handler: any) => {
      if (event === 'connect') connectHandler = handler;
      if (event === 'disconnect') disconnectHandler = handler;
    });

    const { result } = renderHook(() => useSocket());

    // Initially false
    expect(result.current.isConnected).toBe(false);

    // Trigger connect
    act(() => {
      connectHandler();
    });
    expect(result.current.isConnected).toBe(true);

    // Trigger disconnect
    act(() => {
      disconnectHandler();
    });
    expect(result.current.isConnected).toBe(false);
  });
});
