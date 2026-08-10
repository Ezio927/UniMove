import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'ID 格式无效');
const phone = z.string().regex(/^1[3-9]\d{9}$/, '手机号格式无效');
const images = z.array(z.string().min(1).max(2000)).max(10);

export const registerSchema = z.strictObject({
  username: z.string().trim().min(2).max(20),
  email: z.email().max(254),
  password: z.string().min(6).max(128),
  phone: phone.optional()
});

export const loginSchema = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(1).max(128)
});

export const updateProfileSchema = z.strictObject({
  username: z.string().trim().min(2).max(20).optional(),
  phone: phone.optional(),
  avatar: z.string().max(500_000).optional()
}).refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段');

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(6).max(128)
}).refine(value => value.currentPassword !== value.newPassword, {
  message: '新密码不能与当前密码相同', path: ['newPassword']
});

const activityFields = {
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  category: z.string().trim().min(1).max(30),
  location: z.string().trim().min(1).max(200),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  maxParticipants: z.number().int().min(1).max(1000),
  price: z.number().min(0),
  images: images.optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional()
};

export const createActivitySchema = z.strictObject(activityFields).refine(
  value => new Date(value.endTime) > new Date(value.startTime),
  { message: '结束时间必须晚于开始时间', path: ['endTime'] }
);

export const updateActivitySchema = z.strictObject({
  title: activityFields.title.optional(),
  description: activityFields.description.optional(),
  category: activityFields.category.optional(),
  location: activityFields.location.optional(),
  startTime: activityFields.startTime.optional(),
  endTime: activityFields.endTime.optional(),
  maxParticipants: activityFields.maxParticipants.optional(),
  price: activityFields.price.optional(),
  images: activityFields.images,
  tags: activityFields.tags,
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional()
})
  .refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')
  .refine(value => !value.startTime || !value.endTime
    || new Date(value.endTime) > new Date(value.startTime), {
    message: '结束时间必须晚于开始时间', path: ['endTime']
  });

export const createOrderSchema = z.strictObject({ activityId: objectId });
export const payOrderSchema = z.strictObject({ paymentMethod: z.enum(['wechat', 'alipay', 'card']) });
export const cancelOrderSchema = z.strictObject({ reason: z.string().trim().max(500).optional() });

export const createCommentSchema = z.strictObject({
  activityId: objectId,
  content: z.string().trim().min(1).max(1000),
  rating: z.number().int().min(1).max(5),
  images: images.optional()
});

export const updateCommentSchema = z.strictObject({
  content: z.string().trim().min(1).max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  images: images.optional()
}).refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段');
