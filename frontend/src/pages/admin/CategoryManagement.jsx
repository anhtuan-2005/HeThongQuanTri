import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Typography, Row, Col, Card, Modal, Form, Input } from 'antd';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

const CategoryManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      message.error(err.message || 'Lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      message.success('Đã xóa thành công!');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const showAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (record) => {
    setModalMode('edit');
    setEditingId(record.id);
    form.setFieldsValue({ name: record.name });
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      if (modalMode === 'add') {
        const res = await api.post('/categories', values);
        setCategories([res.data, ...categories]);
        message.success('Thêm danh mục mới thành công!');
      } else {
        await api.put(`/categories/${editingId}`, values);
        setCategories(categories.map(c => c.id === editingId ? { ...c, name: values.name } : c));
        message.success('Cập nhật danh mục thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err.name !== 'ValidationError') {
        message.error(err.response?.data?.message || 'Lỗi xảy ra trong quá trình lưu');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã Danh Mục',
      dataIndex: 'id',
      key: 'id',
      width: 150,
    },
    {
      title: 'Tên Danh Mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 250,
      hidden: !isAdmin,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            type="default" 
            style={{ color: '#faad14', borderColor: '#faad14' }}
            onClick={() => showEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa danh mục"
            description="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button icon={<DeleteOutlined />} danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div style={{ padding: '0 16px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }} className="!text-slate-100">Quản lý Danh Mục Đầu Sách</Title>
        </Col>
        {isAdmin && (
          <Col>
            <Button type="primary" icon={<PlusCircleOutlined />} size="large" onClick={showAddModal}>
              Thêm danh mục
            </Button>
          </Col>
        )}
      </Row>

      <Card bordered={false} className="rounded-2xl">
        <Table 
          columns={columns} 
          dataSource={categories} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={modalMode === 'add' ? 'Thêm Danh Mục Mới' : 'Cập Nhật Danh Mục'}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        confirmLoading={submitLoading}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="name"
            label="Tên danh mục (*)"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="VD: Sách Tâm Lý, Sách Kỹ Năng..." size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
