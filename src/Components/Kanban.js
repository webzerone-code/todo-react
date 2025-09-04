import React, { useState,useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Card,
    Modal
} from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {API_URLS} from "../constants/ApiUrls";


const Kanban = () => {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editTaskId, setEditTaskId] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskBody, setNewTaskBody] = useState('');
    const [selectedColumn, setSelectedColumn] = useState('backlog');

    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');
    const [perPage, setPerPage] = useState(100);


    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
                setPerPage(prev => prev + 100);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks',perPage,search],
        queryFn: async () => {
            const res = await axios.get(`${API_URLS.GET_TASKS}?per_page=${perPage}&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return res.data.data;
        },
    });

    const columnsList = ['backlog', 'in_progress', 'review', 'done'];

    const groupedTasks = tasks.reduce((acc, task) => {
        if (!acc[task.status]) acc[task.status] = [];
        acc[task.status].push(task);
        return acc;
    }, {});

    // Add task mutation
    const addTaskMutation = useMutation({
        mutationFn: async (newTask) => {
            const res = await axios.post(`${API_URLS.ADD_TASK}`, newTask, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setShowModal(false);
            setNewTaskTitle('');
            setNewTaskBody('');
        },
    });

    const handleSaveTask = () => {
        if (!newTaskTitle.trim()) return alert('Title is required');
        addTaskMutation.mutate({
            title: newTaskTitle,
            description: newTaskBody,
            status: selectedColumn,
        });
    };

    const emptyModel = ()=>{
        setEditTaskId(null)
        setEditingTask(null)
        setNewTaskTitle('');
        setNewTaskBody('');
        setSelectedColumn(columnsList[0]);
        setShowModal(false);
    }

    const setEditShowModal = (task) => {
        setEditTaskId(task.id);
        setEditingTask(true);
        setNewTaskTitle(task.title);
        setNewTaskBody(task.description);
        setSelectedColumn(task.status);
        setShowModal(true);
    }

    const editTaskMutation = useMutation({
        mutationFn: async (task) => {
            const res = await axios.put(`${API_URLS.UPDATE_TASK}/${editTaskId}`, task, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setEditingTask(null);
            setEditTaskId(null);
            setShowModal(false);
            setNewTaskTitle('');
            setNewTaskBody('');
        },
    });

    const handleEditTask = () => {
        if (!newTaskTitle.trim()) return alert('Title is required');
        editTaskMutation.mutate({
            title: newTaskTitle,
            description: newTaskBody,
            status: selectedColumn,
        });
    };//alert(`Edit ${task.title}`);



    const handleDelete = useMutation({
        mutationFn: async (taskId) => {
            await axios.delete(`${API_URLS.DELETE_TASK}/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        },
        onSuccess: (_, taskId) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const sourceTasks = groupedTasks[source.droppableId] || [];
        const destTasks = groupedTasks[destination.droppableId] || [];
        const [moved] = sourceTasks.splice(source.index, 1);
        moved.status = destination.droppableId;
        destTasks.splice(destination.index, 0, moved);

        try {
            await axios.put(`${API_URLS.UPDATE_TASK}/${moved.id}`, { status: moved.status }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col md={8}>
                    <Form.Control
                        type="text"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Col>
                <Col md={4}>
                    <Button variant="primary" onClick={() => setShowModal(true)} className="w-100">
                        Add Task
                    </Button>
                </Col>
            </Row>

            <DragDropContext onDragEnd={onDragEnd}>
                <Row>
                    {columnsList.map((colId) => (
                        <Col key={colId}>
                            <h5 className="text-center mb-3">{colId.replace('_', ' ').toUpperCase()}</h5>
                            <Droppable droppableId={colId}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{ minHeight: '100px', maxHeight: '70vh', overflowY: 'auto' }}
                                    >
                                        {groupedTasks[colId]?.filter(task =>
                                            task.title.toLowerCase().includes(search.toLowerCase())
                                        ).map((task, idx) => (
                                            <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={idx}>
                                                {(provided) => (
                                                    <Card
                                                        className="mb-2"
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <Card.Body>
                                                            <Card.Title>{task.title}</Card.Title>
                                                            <Card.Text>{task.description}</Card.Text>
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <FaEdit style={{ cursor: 'pointer' }} onClick={() => setEditShowModal(task)} />
                                                                {/*//onClick={() => handleEdit(task)} />*/}
                                                                <FaTrash
                                                                    style={{ cursor: 'pointer', color: 'red' }}
                                                                    onClick={() => handleDelete.mutate(task.id)}
                                                                />
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </Col>
                    ))}
                </Row>
            </DragDropContext>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Task</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Task Title</Form.Label>
                        <Form.Control
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Task Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={newTaskBody}
                            onChange={(e) => setNewTaskBody(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Column</Form.Label>
                        <Form.Select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                        >
                            {columnsList.map((col) => (
                                <option key={col} value={col}>
                                    {col.replace('_', ' ').toUpperCase()}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => emptyModel(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={editingTask ? handleEditTask :handleSaveTask}>
                        Save Task
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Kanban;
