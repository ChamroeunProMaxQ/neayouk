import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TelegramService } from '@src/setting/telegram.service.js';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminSettingController - Telegram Integration (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let branch1AdminToken: string;
  let branch2AdminToken: string;
  let telegramService: TelegramService;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;
    telegramService = app.get(TelegramService);

    branch1AdminToken = ctx.createToken({
      sub: 10,
      username: 'branch1_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
    });

    branch2AdminToken = ctx.createToken({
      sub: 20,
      username: 'branch2_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: 2,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  it('GET /api/v1/admin/settings/integrations/telegram - returns telegram integration config', async () => {
    const res = await request(server)
      .get('/api/v1/admin/settings/integrations/telegram')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .expect(200);

    expect(res.body.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.provider).toBe('TELEGRAM');
  });

  it('PUT /api/v1/admin/settings/integrations/telegram - saves and masks telegram credentials', async () => {
    // Mock getMe so external Telegram network call is simulated reliably
    vi.spyOn(telegramService, 'getMe').mockResolvedValueOnce({
      ok: true,
      result: {
        id: 123456789,
        is_bot: true,
        first_name: 'Neayouk School Bot',
        username: 'NeayoukSchoolBot',
      },
    });

    const payload = {
      isEnabled: true,
      botToken: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ123456789',
      defaultChatId: '-1009988776655',
      attendanceChatId: '-1009988776601',
      paymentChatId: '-1009988776602',
      leaveChatId: '-1009988776603',
      notificationEvents: {
        attendance: true,
        payment: true,
        leave: true,
        announcement: false,
      },
    };

    const res = await request(server)
      .put('/api/v1/admin/settings/integrations/telegram')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send(payload)
      .expect(200);

    expect(res.body.status).toBe(200);
    expect(res.body.data.isEnabled).toBe(true);
    expect(res.body.data.botUsername).toBe('@NeayoukSchoolBot');
    expect(res.body.data.defaultChatId).toBe(payload.defaultChatId);
    expect(res.body.data.attendanceChatId).toBe(payload.attendanceChatId);
    expect(res.body.data.paymentChatId).toBe(payload.paymentChatId);
    // Verified masked token
    expect(res.body.data.botTokenMasked).toBeDefined();
    expect(res.body.data.botTokenMasked).toContain('••••');
    expect(res.body.data.botTokenMasked).not.toBe(payload.botToken);
  });

  it('POST /api/v1/admin/settings/integrations/telegram/test - tests telegram connection dispatch', async () => {
    vi.spyOn(telegramService, 'getMe').mockResolvedValueOnce({
      ok: true,
      result: {
        id: 123456789,
        is_bot: true,
        first_name: 'Neayouk School Bot',
        username: 'NeayoukSchoolBot',
      },
    });

    vi.spyOn(telegramService, 'sendMessage').mockResolvedValueOnce({
      ok: true,
    });

    const res = await request(server)
      .post('/api/v1/admin/settings/integrations/telegram/test')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        targetCategory: 'payment',
      })
      .expect(201);

    expect(res.body.status).toBe(201);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.botUsername).toBe('@NeayoukSchoolBot');
    expect(res.body.data.chatId).toBe('-1009988776602');
  });

  it('PUT /api/v1/admin/settings/integrations/telegram - fails with 400 when defaultChatId is missing', async () => {
    const res = await request(server)
      .put('/api/v1/admin/settings/integrations/telegram')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        isEnabled: true,
        defaultChatId: '',
      })
      .expect(400);

    expect(res.body.status).toBe(400);
  });

  it('Verifies Branch 2 cannot see Branch 1 Telegram configuration (Tenant Scoping)', async () => {
    const res = await request(server)
      .get('/api/v1/admin/settings/integrations/telegram')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    // Branch 2 should not have Branch 1's custom configuration
    expect(res.body.data.defaultChatId).not.toBe('-1009988776655');
  });
});
