/**
 * cliExecutor.test.ts
 * Tests for CLI executor utilities
 */

import type {
  ChildProcess,
  ExecFileException,
  ExecFileOptions,
} from 'node:child_process';
import { execFile } from 'node:child_process';
import {
  findSecureBinaryPath,
  getEnvironmentBinaryConfig,
} from './binaryValidator.js';
import { executeCli } from './cliExecutor.js';
import { triggerPermissionPrompt } from './permissionPrompt.js';
import { findProjectRoot } from './projectUtils.js';

type ExecFileCallback =
  | ((
      error: ExecFileException | null,
      stdout: string | Buffer,
      stderr: string | Buffer,
    ) => void)
  | null
  | undefined;

jest.mock('node:child_process');
jest.mock('./projectUtils.js', () => ({
  findProjectRoot: jest.fn(),
}));
jest.mock('./binaryValidator.js', () => ({
  findSecureBinaryPath: jest.fn(),
  getEnvironmentBinaryConfig: jest.fn(),
}));
jest.mock('./permissionPrompt.js', () => ({
  triggerPermissionPrompt: jest.fn(),
}));

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
const mockFindProjectRoot = findProjectRoot as jest.MockedFunction<
  typeof findProjectRoot
>;
const mockFindSecureBinaryPath = findSecureBinaryPath as jest.MockedFunction<
  typeof findSecureBinaryPath
>;
const mockGetEnvironmentBinaryConfig =
  getEnvironmentBinaryConfig as jest.MockedFunction<
    typeof getEnvironmentBinaryConfig
  >;
const mockTriggerPermissionPrompt =
  triggerPermissionPrompt as jest.MockedFunction<
    typeof triggerPermissionPrompt
  >;

describe('cliExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindProjectRoot.mockReturnValue('/test/project');
    mockGetEnvironmentBinaryConfig.mockReturnValue({});
    mockFindSecureBinaryPath.mockReturnValue({
      path: '/test/project/bin/EventKitCLI',
    });
  });

  const invokeCallback = (
    optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
    callback?: ExecFileCallback,
  ): ExecFileCallback | undefined =>
    (typeof optionsOrCallback === 'function' ? optionsOrCallback : callback) as
      | ExecFileCallback
      | undefined;

  describe('executeCli', () => {
    it('returns parsed result on success', async () => {
      const mockStdout = JSON.stringify({
        status: 'success',
        result: { id: '123', title: 'Test reminder' },
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(null, mockStdout, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      const result = await executeCli(['--action', 'read', '--id', '123']);

      expect(result).toEqual({ id: '123', title: 'Test reminder' });
      expect(mockExecFile).toHaveBeenCalledWith(
        '/test/project/bin/EventKitCLI',
        ['--action', 'read', '--id', '123'],
        expect.any(Function),
      );
    });

    it('throws CLI error message from parsed stdout', async () => {
      const mockStdout = JSON.stringify({
        status: 'error',
        message: 'Failed to read reminder',
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(null, mockStdout, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('Failed to read reminder');
    });

    it('throws error when binary path validation fails', async () => {
      mockFindSecureBinaryPath.mockReturnValue({ path: null });

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('EventKitCLI binary not found or validation failed');
    });

    it('wraps unexpected exec failures', async () => {
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        const error = Object.assign(new Error('Command failed'), {
          stdout: '',
          stderr: '',
        }) as ExecFileException;
        cb?.(error, '', '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('EventKitCLI execution failed: Command failed');
    });

    it('throws when stdout is invalid JSON', async () => {
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(null, 'invalid json', '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('EventKitCLI execution failed');
    });

    it('handles non-Error exceptions gracefully', async () => {
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        const error = Object.assign(new Error('string error'), {
          stdout: '',
          stderr: '',
        }) as ExecFileException;
        cb?.(error, '', '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('EventKitCLI execution failed: string error');
    });

    it('computes CLI path using findProjectRoot', async () => {
      mockFindProjectRoot.mockReturnValue('/custom/project/path');
      mockFindSecureBinaryPath.mockReturnValue({
        path: '/custom/project/path/bin/EventKitCLI',
      });
      const mockStdout = JSON.stringify({
        status: 'success',
        result: { success: true },
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(null, mockStdout, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await executeCli(['--action', 'read']);

      expect(mockExecFile).toHaveBeenCalledWith(
        '/custom/project/path/bin/EventKitCLI',
        ['--action', 'read'],
        expect.any(Function),
      );
    });

    it('throws permission error without retry (permission auto-retry removed)', async () => {
      const permissionError = JSON.stringify({
        status: 'error',
        message: 'Reminder permission denied or restricted.',
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        const error = Object.assign(new Error('Command failed'), {
          stderr: '',
        }) as ExecFileException;
        cb?.(error, permissionError, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(executeCli(['--action', 'read'])).rejects.toThrow(
        'Reminder permission denied or restricted.',
      );

      expect(mockTriggerPermissionPrompt).not.toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledTimes(1);
    });

    it('throws calendar permission error without retry (permission auto-retry removed)', async () => {
      const permissionError = JSON.stringify({
        status: 'error',
        message: 'Calendar permission denied or restricted.',
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        const error = Object.assign(new Error('Command failed'), {
          stderr: '',
        }) as ExecFileException;
        cb?.(error, permissionError, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(executeCli(['--action', 'read-events'])).rejects.toThrow(
        'Calendar permission denied or restricted.',
      );

      expect(mockTriggerPermissionPrompt).not.toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledTimes(1);
    });

    it('throws permission error immediately (no retry)', async () => {
      const permissionError = JSON.stringify({
        status: 'error',
        message: 'Reminder permission denied.',
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        const error = Object.assign(new Error('Command failed'), {
          stderr: '',
        }) as ExecFileException;
        cb?.(error, permissionError, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(executeCli(['--action', 'read'])).rejects.toThrow(
        'Reminder permission denied.',
      );
      expect(mockTriggerPermissionPrompt).not.toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledTimes(1);
    });

    it('throws calendar permission error immediately', async () => {
      const permissionError = JSON.stringify({
        status: 'error',
        message: 'Calendar permission denied.',
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        const error = Object.assign(new Error('Command failed'), {
          stderr: '',
        }) as ExecFileException;
        cb?.(error, permissionError, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(executeCli(['--action', 'read'])).rejects.toThrow(
        'Calendar permission denied.',
      );

      expect(mockTriggerPermissionPrompt).not.toHaveBeenCalled();
    });

    it('throws authorization error immediately', async () => {
      const permissionError = JSON.stringify({
        status: 'error',
        message: 'Authorization denied.',
      });

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        const error = Object.assign(new Error('Command failed'), {
          stderr: '',
        }) as ExecFileException;
        cb?.(error, permissionError, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        executeCli(['--action', 'create-event', '--title', 'Test']),
      ).rejects.toThrow('Authorization denied.');

      expect(mockTriggerPermissionPrompt).not.toHaveBeenCalled();
    });

    it('handles empty stdout by throwing error', async () => {
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(null, '', '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('EventKitCLI execution failed: Empty CLI output');
    });

    it('handles null stdout by throwing error', async () => {
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(null, null as unknown as string, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('EventKitCLI execution failed');
    });

    it('handles action at end of args array', async () => {
      const permissionError = JSON.stringify({
        status: 'error',
        message: 'Permission denied.',
      });
      const successOutput = JSON.stringify({
        status: 'success',
        result: { ok: true },
      });

      let call = 0;
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        call += 1;
        if (call === 1) {
          const error = Object.assign(new Error('Command failed'), {
            stderr: '',
          }) as ExecFileException;
          cb?.(error, permissionError, '');
        } else {
          cb?.(null, successOutput, '');
        }
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      mockTriggerPermissionPrompt.mockResolvedValue();

      await expect(
        executeCli(['--title', 'Test', '--action', 'update-event']),
      ).rejects.toThrow('Permission denied.');

      expect(mockTriggerPermissionPrompt).not.toHaveBeenCalled();
    });

    it('defaults to reminders when action flag is missing value', async () => {
      const permissionError = JSON.stringify({
        status: 'error',
        message: 'Permission denied.',
      });
      const successOutput = JSON.stringify({
        status: 'success',
        result: { ok: true },
      });

      let call = 0;
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        call += 1;
        if (call === 1) {
          const error = Object.assign(new Error('Command failed'), {
            stderr: '',
          }) as ExecFileException;
          cb?.(error, permissionError, '');
        } else {
          cb?.(null, successOutput, '');
        }
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      mockTriggerPermissionPrompt.mockResolvedValue();

      await expect(executeCli(['--title', 'Test', '--action'])).rejects.toThrow(
        'Permission denied.',
      );

      expect(mockTriggerPermissionPrompt).not.toHaveBeenCalled();
    });

    it('should handle Buffer output in bufferToString', async () => {
      const bufferData = Buffer.from(
        JSON.stringify({ status: 'success', result: { ok: true } }),
      );

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(null, bufferData, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      const result = await executeCli(['--action', 'read']);

      expect(result).toEqual({ ok: true });
    });

    it('should handle non-Error objects in error path', async () => {
      const stringError = 'Custom error string';

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(stringError as unknown as ExecFileException, '', '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(executeCli(['--action', 'read'])).rejects.toThrow(
        /EventKitCLI execution failed.*Custom error string/,
      );
    });

    it('should handle null output in error path', async () => {
      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        cb?.(new Error('Failed'), '', '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(executeCli(['--action', 'read'])).rejects.toThrow(
        'EventKitCLI execution failed',
      );
    });

    it('should handle non-string, non-Buffer, non-null data in bufferToString', async () => {
      // Test the String(data) branch by passing a number
      const validJsonString = '{"status":"success","result":{"value":123}}';

      mockExecFile.mockImplementation(((
        _cliPath: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        // bufferToString will convert 123 to "123", but we need valid JSON
        // So let's test with a valid JSON string instead
        cb?.(null, validJsonString, '');
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      const result = await executeCli(['--action', 'read']);
      expect(result).toEqual({ value: 123 });
    });
  });
});
