import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import UploadBox from '../components/UploadBox';

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Backend එක නැති නිසා dummy data ටිකක් මෙතනට දාමු
    const dummyFiles = [
        { id: 1, name: "Project_Report.pdf", mimeType: "application/pdf", size: 1240, createdAt: new Date() },
        { id: 2, name: "Design_Assets.zip", mimeType: "application/zip", size: 5420, createdAt: new Date() },
        { id: 3, name: "Profile_Pic.png", mimeType: "image/png", size: 850, createdAt: new Date() },
        { id: 4, name: "Expenses.xlsx", mimeType: "application/vnd.ms-excel", size: 450, createdAt: new Date() },
    ];

    const fetchFiles = async () => {
        setLoading(true);
        // ඇත්තටම API එකකට කතා කරනවා වෙනුවට තත්පරයක් ඉඳලා dummy data ටික set කරනවා
        setTimeout(() => {
            setFiles(dummyFiles);
            setLoading(false);
        }, 1000);
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar onUploadClick={() => setShowUploadModal(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div className="container mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-semibold text-gray-800">All Files</h1>
                            <button 
                                onClick={() => setShowUploadModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                            >
                                + Upload New
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {files.map((file) => (
                                    <FileCard key={file.id} file={file} onRefresh={fetchFiles} />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {showUploadModal && (
                <UploadBox 
                    onClose={() => setShowUploadModal(false)} 
                    onUploadSuccess={() => setShowUploadModal(false)} 
                />
            )}
        </div>
    );
};

export default Dashboard;