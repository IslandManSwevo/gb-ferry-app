'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Form, Input, Layout, Row, Select, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

export default function CheckInPage() {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('Check-in submitted:', values);
    // TODO: Call API to check in passenger
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <Title level={3} style={{ marginBottom: 24 }}>
              <UserAddOutlined style={{ marginRight: 12 }} />
              Passenger Check-In
            </Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ maxWidth: 800 }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="familyName"
                    label="Family Name"
                    rules={[{ required: true, message: 'Please enter family name' }]}
                  >
                    <Input placeholder="Smith" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="givenNames"
                    label="Given Names"
                    rules={[{ required: true, message: 'Please enter given names' }]}
                  >
                    <Input placeholder="John William" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="dateOfBirth"
                    label="Date of Birth"
                    rules={[{ required: true, message: 'Please select date of birth' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="nationality"
                    label="Nationality"
                    rules={[{ required: true, message: 'Please select nationality' }]}
                  >
                    <Select placeholder="Select nationality">
                      <Select.Option value="USA">United States</Select.Option>
                      <Select.Option value="BHS">Bahamas</Select.Option>
                      <Select.Option value="GBR">United Kingdom</Select.Option>
                      <Select.Option value="CAN">Canada</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true, message: 'Please select gender' }]}
                  >
                    <Select placeholder="Select gender">
                      <Select.Option value="M">Male</Select.Option>
                      <Select.Option value="F">Female</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="identityDocType"
                    label="Document Type"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select document type">
                      <Select.Option value="PASSPORT">Passport</Select.Option>
                      <Select.Option value="ID_CARD">ID Card</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="identityDocNumber"
                    label="Document Number"
                    rules={[{ required: true, message: 'Please enter document number' }]}
                  >
                    <Input placeholder="123456789" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="identityDocExpiry"
                    label="Document Expiry"
                    rules={[{ required: true }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="sailingId"
                    label="Sailing"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select sailing">
                      <Select.Option value="sail-1">NAS → FPB (Today 14:00)</Select.Option>
                      <Select.Option value="sail-2">FPB → NAS (Today 18:30)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="cabinOrSeat"
                    label="Cabin/Seat"
                  >
                    <Input placeholder="A101" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large">
                  Complete Check-In
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
