import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  App,
  Alert,
  Space,
  Row,
  Col,
  Typography
} from 'antd';
import {
  SaveOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppSelector } from '../store/hooks';
import { activityAPI, type CreateActivityData } from '../api/activity';
import { getErrorMessage } from '../api/error';
import './CreateActivity.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CreateActivity: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 检查用户权限
  React.useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      message.error('只有管理员可以创建活动');
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate, message]);

  const categories = [
    '足球', '篮球', '羽毛球', '乒乓球', '网球',
    '游泳', '跑步', '健身', '其他'
  ];

interface FormValues {
  title: string;
  description: string;
  category: string;
  location: string;
  timeRange: [dayjs.Dayjs, dayjs.Dayjs];
  maxParticipants: number;
  price: number;
  tags: string[];
}

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const [startTime, endTime] = values.timeRange;

      const activityData: CreateActivityData = {
        title: values.title,
        description: values.description,
        category: values.category,
        location: values.location,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        maxParticipants: values.maxParticipants,
        price: values.price || 0,
        tags: values.tags || []
      };

      const response = await activityAPI.createActivity(activityData);
      
      if (response.success) {
        message.success('活动创建成功！');
        navigate(`/activities/${response.data.activity._id}`);
      } else {
        message.error(response.message || '创建活动失败');
      }
    } catch (error) {
      message.error(getErrorMessage(error, '创建活动失败，请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-activity-container">
      <Card className="create-activity-card">
        <div className="create-activity-header">
          <Title level={2}>
            <CalendarOutlined /> 创建新活动
          </Title>
          <Text type="secondary">发布精彩的体育活动，吸引更多参与者</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
          className="create-activity-form"
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="活动标题"
                name="title"
                rules={[
                  { required: true, message: '请输入活动标题' },
                  { max: 100, message: '标题最多100个字符' }
                ]}
              >
                <Input
                  placeholder="请输入活动标题"
                  prefix={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                label="活动类别"
                name="category"
                rules={[{ required: true, message: '请选择活动类别' }]}
              >
                <Select placeholder="选择活动类别">
                  {categories.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="活动描述"
            name="description"
            rules={[
              { required: true, message: '请输入活动描述' },
              { max: 2000, message: '描述最多2000个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="详细描述活动内容、规则、注意事项等..."
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="活动地点"
                name="location"
                rules={[{ required: true, whitespace: true, message: '请输入活动地点' }, { max: 200, message: '地点最多200个字符' }]}
              >
                <Input
                  placeholder="请输入活动地点"
                  maxLength={200}
                  prefix={<EnvironmentOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                label="活动时间"
                name="timeRange"
                rules={[{ required: true, message: '请选择活动时间' }]}
              >
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder={['开始时间', '结束时间']}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} lg={8}>
              <Form.Item
                label="最大参与人数"
                name="maxParticipants"
                rules={[
                  { required: true, message: '请输入最大参与人数' },
                  { type: 'number', min: 1, message: '人数至少为1' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  placeholder="最大人数"
                  prefix={<TeamOutlined />}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                label="活动费用 (元)"
                name="price"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  prefix={<DollarOutlined />}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                label="活动标签"
                name="tags"
              >
                <Select
                  mode="tags"
                  placeholder="添加标签 (可选)"
                  tokenSeparators={[',']}
                  maxTagCount={5}
                />
              </Form.Item>
            </Col>
          </Row>

          <Alert showIcon type="info" message="图片上传暂未开放" description="活动创建后会使用统一占位图，不影响发布和报名。" />

          <Form.Item className="form-actions">
            <Space size="large">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                icon={<SaveOutlined />}
              >
                创建活动
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/activities')}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateActivity;
