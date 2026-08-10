import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Input, Select, Button, Space, Pagination, Spin } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import type { ActivityFilters } from '../api/activity';
import ActivityCard from '../components/ActivityCard';
import { useAppSelector } from '../store/hooks';
import { DEFAULT_ACTIVITY_FILTERS, parseActivityFilters, serializeActivityFilters } from '../utils/activityFilters';
import { useActivityCatalog } from '../hooks/useActivityCatalog';
import './ActivityList.css';

const { Search } = Input;
const { Option } = Select;

const ActivityList: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  

  // 筛选条件
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_ACTIVITY_FILTERS);
  const { activities, loading, userOrders, pagination, setPagination, joining,
    joinActivity, leaveActivity } =
    useActivityCatalog(filters, isAuthenticated);

  // 从URL参数初始化筛选条件
  useEffect(() => {
    const initialFilters = parseActivityFilters(location.search);
    
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, current: initialFilters.page || 1 }));
  }, [location.search, setPagination]);



  // 更新URL参数
  const updateUrlParams = (newFilters: ActivityFilters) => {
    const newUrl = `${location.pathname}?${serializeActivityFilters(newFilters)}`;
    window.history.replaceState({}, '', newUrl);
  };

  // 处理筛选条件变化
  const handleFiltersChange = (newFilters: Partial<ActivityFilters>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page || 1, // 筛选条件变化时重置页码
    };
    
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters);
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    handleFiltersChange({ search: value, page: 1 });
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    handleFiltersChange({ page });
  };

  // 处理参加活动
  const handleJoinActivity = async (activityId: string) => {
    await joinActivity(activityId);
  };

  // 处理退出活动
  const handleLeaveActivity = async (activityId: string) => {
    await leaveActivity(activityId);
  };

  // 重置筛选条件
  const handleReset = () => {
    const resetFilters = DEFAULT_ACTIVITY_FILTERS;
    setFilters(resetFilters);
    updateUrlParams(resetFilters);
  };

  return (
    <div className="activity-list-page">
      {/* 搜索和筛选 */}
      <Card className="filters-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="search-section">
            <Search
              placeholder="搜索活动标题、描述或标签..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              size="large"
              allowClear
            />
          </div>
          
          <Row gutter={16} className="filter-section">
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="运动分类"
                value={filters.category || undefined}
                onChange={(value) => handleFiltersChange({ category: value, page: 1 })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="篮球">篮球</Option>
                <Option value="足球">足球</Option>
                <Option value="羽毛球">羽毛球</Option>
                <Option value="乒乓球">乒乓球</Option>
                <Option value="网球">网球</Option>
                <Option value="游泳">游泳</Option>
                <Option value="健身">健身</Option>
                <Option value="跑步">跑步</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="活动地点"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                onPressEnter={() => handleFiltersChange({ location: filters.location, page: 1 })}
                allowClear
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="排序方式"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-');
                  handleFiltersChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 });
                }}
                style={{ width: '100%' }}
              >
                <Option value="createdAt-desc">最新发布</Option>
                <Option value="startTime-asc">即将开始</Option>
                <Option value="price-asc">价格从低到高</Option>
                <Option value="price-desc">价格从高到低</Option>
                <Option value="currentParticipants-desc">参与人数最多</Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => handleFiltersChange(filters)}
                >
                  筛选
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* 活动列表 */}
      <Spin spinning={loading}>
        <div className="activities-section">
          <Row gutter={[16, 16]}>
            {activities.map((activity) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={activity._id}>
                <ActivityCard
                  activity={activity}
                  onJoin={handleJoinActivity}
                  onLeave={handleLeaveActivity}
                  isJoined={userOrders.includes(activity._id)}
                  loading={joining === activity._id}
                />
              </Col>
            ))}
          </Row>
          
          {activities.length === 0 && !loading && (
            <Card className="empty-state">
              <div className="empty-content">
                <SearchOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <h3>没有找到符合条件的活动</h3>
                <p>试试调整筛选条件或关键词</p>
                <Button onClick={handleReset}>重置筛选条件</Button>
              </div>
            </Card>
          )}
        </div>
      </Spin>

      {/* 分页 */}
      {pagination.total > 0 && (
        <div className="pagination-section">
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条活动`
            }
          />
        </div>
      )}
    </div>
  );
};

export default ActivityList;
