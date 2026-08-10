import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  activity: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  paymentTime?: Date;
  cancelReason?: string;
  refundAmount?: number;
  refundTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'UM' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户信息不能为空']
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, '活动信息不能为空']
  },
  amount: {
    type: Number,
    required: [true, '订单金额不能为空'],
    min: [0, '订单金额不能为负数']
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'card']
  },
  paymentTime: {
    type: Date
  },
  cancelReason: {
    type: String,
    maxlength: [500, '取消原因不能超过500个字符']
  },
  refundAmount: {
    type: Number,
    min: [0, '退款金额不能为负数']
  },
  refundTime: {
    type: Date
  }
}, {
  timestamps: true
});

// 创建索引
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ activity: 1 });
OrderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
