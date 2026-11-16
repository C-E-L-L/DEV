import Announcements from './Announcements';

export default function AnnouncementsPage({ manage = false }) {
  return <>
    <div className="prof-page-head"><div><h1>공지사항</h1><p>{manage
      ? '나에게 공개된 공지와 내가 작성한 공지를 확인합니다. 본인이 작성한 공지만 수정·삭제할 수 있습니다.'
      : '등록된 공지 중 나에게 공개된 안내를 확인합니다.'}</p></div></div>
    <Announcements manage={manage} compact={false} />
  </>;
}
