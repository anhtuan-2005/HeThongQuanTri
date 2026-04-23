import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Typography, Card, Tag, Tabs } from 'antd';
import { ReloadOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axios';

const { Title, Text } = Typography;

const TrashPage = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrashData();
  }, []);

  const fetchTrashData = async () => {
    try {
      setLoading(true);
      const [resProducts, resCustomers] = await Promise.all([
        api.get('/trash/products'),
        api.get('/customers')
      ]);
      setProducts(resProducts.data || []);
      // Lọc các khách hàng đã bị xóa ở Frontend
      setCustomers((resCustomers.data || []).filter(c => c.isDeleted));
    } catch (err) {
      message.error(err.message || 'Lỗi khi tải danh sách thùng rác');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async (id) => {
    try {
      await api.put(`/trash/products/${id}/restore`);
      setProducts(products.filter(p => p.id !== id));
      message.success('Đã khôi phục sản phẩm thành công!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi khôi phục');
    }
  };

  const handleHardDeleteProduct = async (id) => {
    try {
      await api.delete(`/trash/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      message.success('Sản phẩm đã được ẩn vĩnh viễn!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleRestoreCustomer = async (record) => {
    try {
      const payload = { ...record, isDeleted: false };
      if (payload.birthday) {
        payload.birthday = dayjs(payload.birthday).format('YYYY-MM-DD');
      }
      await api.put(`/customers/${record.id}`, payload);
      setCustomers(customers.filter(c => c.id !== record.id));
      message.success('Đã khôi phục khách hàng thành công!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi khôi phục');
    }
  };

  const handleHardDeleteCustomer = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(customers.filter(c => c.id !== id));
      message.success('Khách hàng đã được xóa vĩnh viễn!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const productColumns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (text, record) => (
        text ? 
        <img src={text} alt={record.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} /> 
        : <div style={{ width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">N/A</Text></div>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (text) => <Tag color="blue">{text || 'Chưa phân loại'}</Tag>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <Text strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}</Text>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Khôi phục sản phẩm?"
            description="Bạn có chắc chắn muốn khôi phục sản phẩm này?"
            onConfirm={() => handleRestoreProduct(record.id)}
            okText="Khôi phục"
            cancelText="Hủy"
          >
            <Button icon={<ReloadOutlined />} type="primary" ghost>
              Khôi phục
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Ẩn khỏi giao diện?"
            description="Sản phẩm sẽ được ẩn hoàn toàn. Bạn có chắc chắn?"
            onConfirm={() => handleHardDeleteProduct(record.id)}
            okText="Ẩn ngay"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger>
              Ẩn vĩnh viễn
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const customerColumns = [
    { title: 'Họ tên', dataIndex: 'name', key: 'name' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Thao tác',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Khôi phục khách hàng?"
            description="Bạn có chắc chắn muốn khôi phục khách hàng này?"
            onConfirm={() => handleRestoreCustomer(record)}
            okText="Khôi phục"
            cancelText="Hủy"
          >
            <Button icon={<ReloadOutlined />} type="primary" ghost>
              Khôi phục
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Xóa vĩnh viễn?"
            description="Dữ liệu sẽ bị mất hoàn toàn. Bạn có chắc chắn?"
            onConfirm={() => handleHardDeleteCustomer(record.id)}
            okText="Xóa vĩnh viễn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger>
              Xóa vĩnh viễn
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>Thùng Rác</Title>
            <Link to="/">
              <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
            </Link>
          </div>

          <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
            <Tabs.TabPane tab="Sản phẩm" key="1">
              <Table
                columns={productColumns}
                dataSource={products}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Thùng rác sản phẩm trống' }}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Khách hàng" key="2">
              <Table
                columns={customerColumns}
                dataSource={customers}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'Thùng rác khách hàng trống' }}
              />
            </Tabs.TabPane>
          </Tabs>
        </Space>
      </Card>
    </div>
  );
};

export default TrashPage;
