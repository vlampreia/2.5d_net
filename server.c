const int NETWORK_TICK_MS = 50;

struct vector3i {
  int x;
  int y;
  int z;
};

struct vector3i
vector3i_add(struct vector3i v1, struct vector3i v2) {
  struct vector3i res;
  res.x = v1.x + v2.x;
  res.y = v1.y + v2.y;
  res.z = v1.z + v2.z;
  return res;
}

struct vector3i
vector3i_sub(struct vector3i v1, struct vector3i v2) {
  struct vector3i res;
  res.x = v1.x - v2.x;
  res.y = v1.y - v2.y;
  res.z = v1.z - v2.z;
  return res;
}

struct vector3i
vector3i_mulf(struct vector3i v, float f) {
  struct vector3i res;
  res.x = v1.x * f;
  res.y = v1.y * f;
  res.z = v1.z * f;
  return res;
}

struct vector3i
vector3i_lerp(struct vector3i start, struct vector3i end, float percent) {
    /* start + percent * (end - start) */
    return vector3i_add(start, vector3i_mulf(vector3i_sub(end, start), percent);
  );
}

int main(int argc, char* [] argv) {

}

//while (true) {
//  timestamp t1 = current_time();
//  process_input();
//  update();
//  post_updates_to_clients();
//  timestamp t2 = current_time() - t1;
//  if (elapsed < NETWORK_TICK) {
//    sleep(NETWORK_TICK - elapsed);
//  }
//}
