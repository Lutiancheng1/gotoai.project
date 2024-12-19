import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button, Spin } from 'antd'
import { UserOutlined, TeamOutlined, AppstoreOutlined, SyncOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchAllUsers } from '@/store/slices/users.slice'
import { fetchDepartments } from '@/store/slices/departments.slice'
import { fetchApplications } from '@/store/slices/applications.slice'

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { total: totalUsers, loading: usersLoading } = useAppSelector((state) => state.users)
  const { departments, loading: departmentsLoading } = useAppSelector((state) => state.departments)
  const { pagination: appPagination, loading: applicationsLoading } = useAppSelector((state) => state.applications)

  const fetchData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([dispatch(fetchAllUsers({})), dispatch(fetchDepartments()), dispatch(fetchApplications({ page: 1, limit: 10 }))])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dispatch])

  // 计算部门总数（包括子部门）
  const countDepartments = (departments: any[]): number => {
    let count = departments.length
    departments.forEach((dept) => {
      if (dept.children && dept.children.length > 0) {
        count += countDepartments(dept.children)
      }
    })
    return count
  }

  const totalDepartments = countDepartments(departments)
  const isLoading = usersLoading || departmentsLoading || applicationsLoading

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold m-0">数据概览</h1>
        <Button type="primary" icon={<SyncOutlined spin={isRefreshing} />} onClick={fetchData} loading={isRefreshing}>
          刷新数据
        </Button>
      </div>

      <Spin spinning={isLoading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable>
              <Statistic title="用户总数" value={totalUsers} prefix={<UserOutlined className="mr-2 text-blue-500" />} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable>
              <Statistic title="部门总数" value={totalDepartments} prefix={<TeamOutlined className="mr-2 text-green-500" />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable>
              <Statistic title="应用总数" value={appPagination?.total || 0} prefix={<AppstoreOutlined className="mr-2 text-purple-500" />} valueStyle={{ color: '#722ed1' }} />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard
